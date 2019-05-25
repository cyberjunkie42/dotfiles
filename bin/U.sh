#! /bin/bash
# U Drive
 sudo mount.cifs //cisl-ghana.scd.ucar.edu/CISLUdrive/ /U -o username=lmyers,dom=CIT,uid=lmyers,gid=lmyers,rw,ip=128.117.8.53,vers=3.0

# NWSCbuild backup drive (Z)
#sudo mount.cifs //neptuneuser.nwsc.ucar.edu/nwscbuild  /Z -o username=lmyers,dom=CIT,uid=lmyers,gid=lmyers,rw,vers=3.0

# NWSCstatic drive (Y)
#sudo mount.cifs //neptuneuser.nwsc.ucar.edu/nwscstatic  /Y -o username=lmyers,dom=CIT,uid=lmyers,gid=lmyers,rw,vers=3.0
