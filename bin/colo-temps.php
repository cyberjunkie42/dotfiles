#!/usr/bin/php
<?php
/*****************************************************
*
*  COLOCATION TEMP SCRIPT - written by Jonathan Frazier, CASG
*  Contributions by Lee Myers
*  Last Updated: 20150411
*
******************************************************/

date_default_timezone_set('America/Denver');

// Database settings
//$dbHost = 'casg.nwsc.ucar.edu';
$dbHost = '128.117.177.58';
$dbUser = 'casgapi';
$dbPass = 'WeM0n1t0r';
$dbName = 'issuetrack';
$table = 'temps';

// Connect to DB
$con = mysqli_connect($dbHost, $dbUser, $dbPass, $dbName);

// Check connection
if (mysqli_connect_errno($con)) {
        echo "Failed to connect to MySQL: " . mysqli_connect_error();
}


$today = date("Y-m-d G:i:s");
$final = array();

// GET TEMPS
$ips = array("1E19" => "10.202.3.84",
			"1E20" => "10.202.3.85",
			"1E22" => "10.202.3.93",
			"1E23" => "10.202.3.92",
			"1E34" => "10.202.3.57",
			"1E35" => "10.202.3.61",
			"1E36" => "10.202.3.60",
			"1J18" => "10.202.3.100",
			"1J38" => "10.202.3.63");

foreach ($ips as $cab => $ip) {
	if ($cab == "1J18") {
		$racktemp = exec("/usr/bin/snmpget -v1 -Ov -OQ -c public ".$ip." .1.3.6.1.4.1.21239.2.4.1.6.2");
	} else {
		$racktemp = exec("/usr/bin/snmpget -v1 -Ov -OQ -c public ".$ip." .1.3.6.1.4.1.21239.2.4.1.6.1");
	}
	if (preg_match('#^((?!Timeout: No Response).)*$#', $racktemp)) {
		// Locate Rack
		$rackquery = "SELECT `id` FROM racks WHERE `rack`='".$cab."'";
		$rackresult = mysqli_query($con, $rackquery);
		$rack = mysqli_fetch_array($rackresult, MYSQLI_BOTH);

	if ($racktemp != 0) {
                $final[$cab] = array( 'rack_id' => $rack['id'],
                                                               'value' => $racktemp,
                                                               'datetime' => $today
                       );
               }	
#		$final[$cab] = array( 'rack_id' => $rack['id'],
#								'value' => $racktemp,
#								'datetime' => $today
#		);

		// free result set
		mysqli_free_result($rackresult);
	}
}

// MySQL insertion queries from array
foreach ($final as $temp) {

	$query = "INSERT INTO `".$table."` (";
	$trigger = 0;
	foreach($temp as $field => $value){
		if($trigger > 0){
			$query = $query . ", ";
		}
		$query = $query . $field;
		$trigger++;
	}

	$query = $query . ") VALUES (trim('";
	$trigger = 0;
	foreach($temp as $field => $value){
		if($trigger > 0){
			$query = $query . ", trim('";
		}
		$value = str_replace(",", "", $value);
		$query = $query . $value."')";
		$trigger++;
	}
	$query = $query . ");";

	if (!mysqli_query($con,$query)) {
		echo("Query: ".$query."\n");
		echo("Error description: " . mysqli_error($con)."\n");
	}
}

mysqli_close($con);
exit;
?>

