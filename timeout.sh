#!/bin/bash
#
#

cd "$(dirname "$0")" || exit 10


TIMEOUT=$(($(date +%s) + 15))

while :
do
	NOW=$(($(date +%s) + 0))
	if [ $NOW -gt $TIMEOUT ]; then
		echo "TIMEOUT!!"
		exit 1
	fi
	echo "Still waiting!"
	sleep 1
done


echo "Within timeout!"
exit 0
