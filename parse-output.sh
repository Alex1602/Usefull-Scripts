#!/bin/bash
#
#

cd "$(dirname "$0")" || exit 10

#Get two variables from one line
read -r VAR1 VAR2 <<< $(command | awk '/search for/{gsub(/\.{3}/,"",$1); print $1 " " $2 }') 


#start parsing after a matching line
SEARCHFOR="string"
command | awk -v SEARCH="$SEARCHFOR" 'x==1 && $1==SEARCH {print $0} /Line after which to start searching:/ {x=1}'
