#!/bin/bash

# exit immediately when a command fails
set -e
set -o pipefail
set -u

usage() {
echo "Usage: $0 [-e <string>] [-r <int>]" 1>&2
cat <<EOF 1>&2
Cleanup old backup files and keep the latest X

-h          Display help

-r          Retention, The number of files you want to keep. Must be bigger than 0
EOF
exit 1
}

while getopts ":e:r:" o; do
    case "${o}" in
        r)
            RETENTION=${OPTARG}
            (("$RETENTION" > "1")) || usage
            ;;
        *)
            usage
            ;;
    esac
done
shift $((OPTIND-1))

if [ -z "${RETENTION}" ]; then
    usage
fi

echo "Cleaning up all backups except the latest ${RETENTION}"

