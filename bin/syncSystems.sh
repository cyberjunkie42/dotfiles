#!/bin/bash

rsync -azP --exclude '.nx/*' --exclude '.cache/*' lmyers@nwsc-eureka:/home/lmyers/ eureka
