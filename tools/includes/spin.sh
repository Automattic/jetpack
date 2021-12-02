#!/bin/bash

if [[ -t 1 ]]; then
	SPIN=( '-' '\' '|' '/' )
	SPINIDX=0

	function spin {
		printf '\e[1m%s\e[0m\r' "${SPIN[$SPINIDX]}"
		SPINIDX=$(( ( SPINIDX + 1 ) % ${#SPIN[*]} ))
	}

	function spinclear {
		printf '\e[K'
	}
else
	. "$(dirname "$BASH_SOURCE[0]")/nospin.sh"
fi
