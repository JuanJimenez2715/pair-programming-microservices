#!/usr/bin/env sh
# Use this script to test if a given TCP host/port are available

TIMEOUT=15
QUIET=0
HOST="$1"
PORT="$2"

echo "Waiting for $HOST:$PORT..."

for i in `seq $TIMEOUT` ; do
    nc -z "$HOST" "$PORT" > /dev/null 2>&1
    
    result=$?
    if [ $result -eq 0 ] ; then
        if [ $QUIET -ne 1 ] ; then echo "$HOST:$PORT is available after $i seconds" ; fi
        exit 0
    fi
    sleep 1
done

echo "Timeout occurred after waiting $TIMEOUT seconds for $HOST:$PORT"
exit 1
