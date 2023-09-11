#!/usr/bin/env bash

set -e

function usage() {
	echo
	echo "usage: $(basename "$0") <command>"
	echo
	echo "Commands:"
	echo "encrypt		Encrypts the file"
	echo "decrypt		Decrypts the file"
	echo
	exit 1
}

if [[ -z "$CONFIG_KEY" ]]; then
  echo "::error::CONFIG_KEY must be set"
  exit 1
fi

BASE_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ENCRYPTED_FILE="$BASE_DIR/notification-rules.enc"
FLAT_FILE="$BASE_DIR/notification-rules.json"

case $1 in
	encrypt)
		openssl enc -md sha1 -aes-256-cbc -pass env:CONFIG_KEY -in "$FLAT_FILE" -out "$ENCRYPTED_FILE"
		;;
	decrypt)
		openssl enc -md sha1 -aes-256-cbc -pass env:CONFIG_KEY -d -in "$ENCRYPTED_FILE" -out "$FLAT_FILE"
		;;
	*)
		usage
		;;
esac
