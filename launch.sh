#! /bin/sh

cd /home/ubuntu/workspace/
http-server -s -o -c-1 &
cd hellophaser
gulp watch
