#!/usr/bin/env sh

###############################################################################
#                                                                             #
# AnsiWeather 1.04 (c) by Frederic Cambus 2013-2015                           #
# https://github.com/fcambus/ansiweather                                      #
#                                                                             #
# Created: 2013/08/29                                                         #
# Last Updated: 2015/09/10                                                    #
#                                                                             #
# AnsiWeather is released under the BSD 3-Clause license.                     #
# See LICENSE file for details.                                               #
#                                                                             #
###############################################################################



###[ Configuration options ]###################################################

LC_ALL=C
LC_NUMERIC=C

config_file=${ANSIWEATHERRC:-~/.ansiweatherrc}

get_config() {
	ret=""
	if [ -f "$config_file" ]
	then
		ret=$(grep "^$1:" "$config_file" | awk -F: '{print $2}')
	fi

	if [ "X$ret" = "X" ]
	then
		return 1
	else
		echo "$ret"
	fi
}

fetch_cmd=$(get_config "fetch_cmd" || echo "curl -s")



###[ Parse the command line ]##################################################

# Set all variables that can be set from the command line to an empty value.
location="Cheyenne"
units=
forecast=
daylight=
ansi=
symbols=

# Get config options from command line flags
while getopts l:u:f:Fd:a:s:h option
do
	case "${option}"
	in
		l) location=${OPTARG};;
		u) units=${OPTARG};;
		f) forecast=${OPTARG};;
		F) forecast="5";;
		d) daylight=${OPTARG};;
		a) ansi=${OPTARG};;
		s) symbols=${OPTARG};;
		h) usage=true;;
	esac
done



###[ Display usage ]###########################################################

if [ "$usage" = true ]
then
	printf "%s\n" \
		"" \
		"AnsiWeather 1.04 (c) by Frederic Cambus 2013-2015" \
		"" \
		"USAGE: ansiweather [options]" \
		"" \
		"Options are :" \
		"" \
		"	-l Specify location" \
		"	-u Specify unit system to use (metric or imperial)" \
		"	-f Toggle forecast mode for the specified number of upcoming days" \
		"	-F Toggle forecast mode for the next five days" \
		"	-d Toggle daylight data display" \
		"	-a Toggle ANSI colors display" \
		"	-s Toggle symbols display" \
		"	-h Display usage" \
		"" \
		"EXAMPLES: ansiweather -l Moscow,RU -u metric -s true -f 5 -d true" \
		"" 
	exit
fi



###[ Check if bc and jq are installed ]########################################

jqpath=$(which jq)
if [ "$jqpath" = "" ]
then
	echo "ERROR : Cannot find jq binary"
	exit
fi

bcpath=$(which bc)
if [ "$bcpath" = "" ]
then
	echo "ERROR : Cannot find bc binary"
	exit
fi



###[ Auto-Location Logic ]#####################################################

geo_api_proto=$(get_config "geo_api_proto" || echo "http")
geo_api_url=$(get_config "geo_api_url" || echo "www.telize.com/geoip") #geo location service
geo_api="${geo_api_proto}://${geo_api_url}"

auto_locate() {
	ret=""

	geo_data=$($fetch_cmd "$geo_api")

	city=$(echo "$geo_data" | jq -r '.city')

	country=$(echo "$geo_data" | jq -r '.country_code')

	ret=$city,$country

	if [ "$ret" = "," ]
	then
		return 1
	else
		echo "$ret"
	fi
}



###[ Set options that are not set from command line ]##########################

# Location : example "Moscow,RU"
[ -z "$location" ] && location=$(get_config "location" || auto_locate || echo "Moscow,RU")

# System of Units : "metric" or "imperial"
[ -z "$units" ] && units=$(get_config "units" || echo "metric")

# Show forecast : How many days, example "5". "0" is standard output
[ -z "$forecast" ] && forecast=$(get_config "forecast" || echo 0)

# Show daylight : "true" or "false"
[ -z "$daylight" ] && daylight=$(get_config "daylight" || echo false)

# Display ANSI colors : "true" or "false"
[ -z "$ansi" ] && ansi=$(get_config "ansi" || echo true)

# Display symbols : "true" or "false" (requires an Unicode capable display)
[ -z "$symbols" ] && symbols=$(get_config "symbols" || echo true)

dateformat=$(get_config "dateformat" || echo "%a %b %d")
timeformat=$(get_config "timeformat" || echo "%b %d %r")



###[ Colors and characters ]###################################################

background=$(get_config "background" || echo "\033[44m")
text=$(get_config "text" || echo "\033[36;1m")
data=$(get_config "data" || echo "\033[33;1m")
delimiter=$(get_config "delimiter" || echo "\033[35m=>")
dashes=$(get_config "dashes" || echo "\033[34m-")



###[ Text Labels ]#############################################################

greeting_text=$(get_config "greeting_text" || echo "Current weather in")
wind_text=$(get_config "wind_text" || echo "Wind")
humidity_text=$(get_config "humidity_text" || echo "Humidity")
pressure_text=$(get_config "pressure_text" || echo "Pressure")
sunrise_text=$(get_config "sunrise_text" || echo "Sunrise")
sunset_text=$(get_config "sunset_text" || echo "Sunset")



###[ Unicode Symbols for icons ]###############################################

sun=$(get_config "sun" || echo "\033[33;1m\xe2\x98\x80")
moon=$(get_config "moon" || echo "\033[36m\xe2\x98\xbd")
clouds=$(get_config "clouds" || echo "\033[37;1m\xe2\x98\x81")
rain=$(get_config "rain" || echo "\xe2\x98\x94")
fog=$(get_config "fog" || echo "\033[37;1m\xe2\x96\x92")
mist=$(get_config "mist" || echo "\033[34m\xe2\x96\x91")
haze=$(get_config "haze" || echo "\033[33m\xe2\x96\x91")
snow=$(get_config "snow" || echo "\033[37;1m\xe2\x9d\x84")
thunderstorm=$(get_config "thunderstorm" || echo "\xe2\x9a\xa1")



###[ Fetch Weather data ]######################################################

api_cmd=$([ "$forecast" != 0 ] && echo "forecast/daily" || echo "weather")

if [ "$location" -gt 0 ] 2> /dev/null
then
	# Location is all numeric
	weather=$($fetch_cmd "http://api.openweathermap.org/data/2.5/$api_cmd?id=$location&units=$units")
else
	# Location is a string
	weather=$($fetch_cmd "http://api.openweathermap.org/data/2.5/$api_cmd?q=$location&units=$units")
fi

if [ -z "$weather" ]
then
	echo "ERROR : Cannot fetch weather data"
	exit
fi

status_code=$(echo "$weather" | jq -r '.cod')

if [ "$status_code" != 200 ]
then
	echo "ERROR : Cannot fetch weather data for the given location"
	exit
fi



###[ Process Weather data ]####################################################

epoch_to_date() {
	if date -j -r "$1" +"%a %b %d" > /dev/null 2>&1; then
		# BSD
		ret=$(date -j -r "$1" +"$dateformat")
	else
		# GNU
		ret=$(date -d "@$1" +"$dateformat")
	fi
	echo "$ret"
}

if [ "$forecast" != 0 ]
then
	city=$(echo "$weather" | jq -r '.city.name')
	flength=$(echo "$weather" | jq '.list | length')
	forecast=$([ "$forecast" -gt "$flength" ] && echo "$flength" || echo "$forecast")
else
	city=$(echo "$weather" | jq -r '.name')
	temperature=$(printf '%.0f' "$(echo "$weather" | jq '.main.temp')")
	humidity=$(echo "$weather" | jq '.main.humidity')
	pressure=$(echo "$weather" | jq '.main.pressure')
	sky=$(echo "$weather" | jq -r '.weather[0].main')
	sunrise=$(echo "$weather" | jq '.sys.sunrise')
	sunset=$(echo "$weather" | jq '.sys.sunset')
	wind=$(echo "$weather" | jq '.wind.speed')
	azimuth=$(echo "$weather" | jq '.wind.deg')
fi



###[ Process Wind data ]#######################################################

set -- N NNE NE ENE E ESE SE SSE S SSW SW WSW W WNW NW NNW

if [ "$forecast" = 0 ]
then
	shift "$(echo "($azimuth + 11.25)/22.5 % 16" | bc)"
	direction=$1
fi



###[ Process Sunrise and Sunset data ]#########################################

epoch_to_time() {
	if date -j -r "$1" +"%r" > /dev/null 2>&1; then
		# BSD
		ret=$(date -j -r "$1" +"$timeformat")
	else
		# GNU
		ret=$(date -d "@$1" +"$timeformat")
	fi
	echo "$ret"
}

if [ "$forecast" = 0 ]
then
	if [ -n "$sunrise" ]
	then
		sunrise_time=$(epoch_to_time "$sunrise")
	fi

	if [ -n "$sunset" ]
	then
		sunset_time=$(epoch_to_time "$sunset")
	fi
fi



###[ Set the period ]##########################################################

now=$(date +%s)

if [ "$forecast" != 0 ]
then
	period="none"
else
	if [ -z "$sunset" ] || [ -z "$sunrise" ]
	then
		period="day"
	elif [ "$now" -ge "$sunset" ] || [ "$now" -le "$sunrise" ]
	then
		period="night"
	else
		period="day"
	fi
fi



###[ Set the scale ]###########################################################

case $units in
	metric)
		scale="°C"
		speed_unit="m/s"
		pressure_unit="hPa"
		pressure=$(printf '%.0f' "$pressure")
		;;
	imperial)
		scale="°F"
		speed_unit="mph"
		pressure_unit="inHg"
		if [ "$forecast" = 0 ]
		then
			pressure=$(printf '%.2f' "$(echo "$pressure*0.0295" | bc)")
		fi
		;;
esac



###[ Set icons ]###############################################################

get_icon() {
	case $1 in
		Clear)
			if [ $period = "night" ]
			then
				echo "$moon "
			else
				echo "$sun "
			fi
			;;
		Clouds)
			echo "$clouds "
			;;
		Rain)
			echo "$rain "
			;;
		Fog)
			echo "$fog "
			;;
		Mist)
			echo "$mist "
			;;
		Haze)
			echo "$haze "
			;;
		Snow)
			echo "$snow "
			;;
		Thunderstorm)
			echo "$thunderstorm "
			;;
	esac
}



###[ Display current Weather ]#################################################

if [ "$forecast" != 0 ]
then
	output="$background$text $city forecast $text$delimiter "

	i=0
	while [ $i -lt "$forecast" ]
	do
		day=$(echo "$weather" | jq ".list[$i]")
		date=$(epoch_to_date "$(echo "$day" | jq -r '.dt')")
		low=$(printf "%0.0f" "$(echo "$day" | jq -r '.temp.min')")
		high=$(printf "%0.0f" "$(echo "$day" | jq -r '.temp.max')")

		icon=""
		if [ "$symbols" = true ]
		then
			sky=$(echo "$day" | jq -r '.weather[0].main')
			icon=$(get_icon "$sky")
		fi

		output="$output$text$date: $data$high$text/$data$low $scale $icon"
		if [ $i -lt $((forecast-1)) ]
		then
			output="$output$dashes "
		fi

		i=$((i + 1))
	done
else
	if [ "$symbols" = true ]
	then
		icon="$(get_icon "$sky")"
	fi
	output="$background$text $greeting_text $city $delimiter$data $temperature $scale $icon$dashes$text $wind_text $delimiter$data $wind $speed_unit $direction $dashes$text $humidity_text $delimiter$data $humidity %% $dashes$text $pressure_text $delimiter$data $pressure $pressure_unit "

	if [ "$daylight" = true ]
	then
		output="$output $dashes$text $sunrise_text $delimiter$data $sunrise_time $dashes$text $sunset_text $delimiter$data $sunset_time "
	fi
fi

if [ "$ansi" = true ]
then
	/usr/bin/printf "$output\033[0m\n"
else
	/usr/bin/printf "$output\n" | sed "s/$(printf '\033')\[[0-9;]*m//g"
fi
