#! /bin/sh

cd /home/ubuntu/workspace/
http-server -s -o &
cd hellophaser
gulp watch
