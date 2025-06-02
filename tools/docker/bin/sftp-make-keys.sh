#!/bin/bash
set -Eeo pipefail

# The container will only create the keys if they don't exist, while in our setup
# they'll always exist but may be zero size and have incorrect ownership.

if [[ ! -s /etc/ssh/ssh_host_ed25519_key ]]; then
	rm -f /etc/ssh/ssh_host_ed25519_key.tmp
	ssh-keygen -t ed25519 -f /etc/ssh/ssh_host_ed25519_key.tmp -N ''
	cat /etc/ssh/ssh_host_ed25519_key.tmp > /etc/ssh/ssh_host_ed25519_key
	rm /etc/ssh/ssh_host_ed25519_key.tmp
fi
if [[ ! -s /etc/ssh/ssh_host_rsa_key ]]; then
	rm -f /etc/ssh/ssh_host_rsa_key.tmp
	ssh-keygen -t rsa -b 4096 -f /etc/ssh/ssh_host_rsa_key.tmp -N ''
	cat /etc/ssh/ssh_host_rsa_key.tmp > /etc/ssh/ssh_host_rsa_key
	rm /etc/ssh/ssh_host_rsa_key.tmp
fi

chown root:root /etc/ssh/ssh_host_ed25519_key
chown root:root /etc/ssh/ssh_host_rsa_key
