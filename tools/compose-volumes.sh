#!/bin/bash

echo "## Built by tools/compose-volumes.sh"
echo "## Run \`yarn docker:compose-volumes\` to regenerate"

echo ""
echo "version: '3.3'"
echo "services:"
echo "  wordpress:"
echo "    volumes:"
sed 's/^/      /' < "$1"
echo "  sftp:"
echo "    volumes:"
sed 's/^/      /; s!/var/www/html!/home/wordpress/var/www/html!' < "$1"
