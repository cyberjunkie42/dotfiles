#!/bin/bash

# This script is to be used to compare three tools for finding file duplicates, fdupes, fslint, and duff
# I will run all with the tightest comparisons that are possible on the same directory to compare
# Time and the number of files found.

echo "#######################################################"
echo "#     Starting the checks of the deDuplicators        #"
echo "#######################################################"

dupdir=/home/lmyers/TO_GO_THROUGH
du -hs ${dupdir}

echo "#######################################################"
echo "#     Checking fdupes                                 #"
echo "#######################################################"

startdt=`date +%s`
fdupes --recurse --quiet ${dupdir} > fdups.out
enddt=`date +%s`
((diff_sec=enddt-startdt))
runtime=(`echo - | awk '{printf "  %d:%d:%d","'"$diff_sec"'"/(60*60),"'"$diff_sec"'"%(60*60)/60,"'"$diff_sec"'"%60}'`)
echo "Total Runtime: ${runtime}"
cntOfDupes=`grep ${dupdir} fdups.out | wc -l`
((cntOfFD=`find ${dupdir} | wc -l`-1))   #subtract 1 as this counts the current dir
echo "Count of Duplicates: ${cntOfDupes}"
echo "Count of Files/Directories: ${cntOfFD}"
echo
echo "#######################################################"
echo "#     Checking fslint                                 #"
echo "#######################################################"

PATH=$PATH:/usr/share/fslint/fslint #note: findup (cli form of fslint) is not on path by default so add it.
startdt=`date +%s`
findup ${dupdir} > fslint.out
enddt=`date +%s`
((diff_sec=enddt-startdt))
runtime=(`echo - | awk '{printf "  %d:%d:%d","'"$diff_sec"'"/(60*60),"'"$diff_sec"'"%(60*60)/60,"'"$diff_sec"'"%60}'`)
echo "Total Runtime: ${runtime}"
cntOfDupes=`wc -l fslint.out`
((cntOfFD=`find ${dupdir} | wc -l`-1))   #subtract 1 as this counts the current dir
echo "Count of Duplicates: ${cntOfDupes}"
echo "Count of Files/Directories: ${cntOfFD}"
echo
echo "#######################################################"
echo "#     Checking duff                                   #"
echo "#######################################################"

startdt=`date +%s`
duff -d sha512 -aprtz ${dupdir} > duff.out
enddt=`date +%s`
((diff_sec=enddt-startdt))
runtime=(`echo - | awk '{printf "  %d:%d:%d","'"$diff_sec"'"/(60*60),"'"$diff_sec"'"%(60*60)/60,"'"$diff_sec"'"%60}'`)
echo "Total Runtime: ${runtime}"
cntOfDupes=`grep ${dupdir} duff.out | wc -l`
((cntOfFD=`find ${dupdir} | wc -l`-1))   #subtract 1 as this counts the current dir
echo "Count of Duplicates: ${cntOfDupes}"
echo "Count of Files/Directories: ${cntOfFD}"
echo
