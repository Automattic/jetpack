#!/bin/bash

# Compare two version numbers, semver style.
#
# Note this is a bit looser than `pnpm semver`, as it accepts 4-part versions.
#
# @param $1 First version.
# @param $2 Second version.
# @param $3 Pass "1" to test `>` rather than `>=`.
# @return true if $1 >= $2, false otherwise.
function version_compare {
	local -i EQ=${3:0}
	if [[ "$1" == "$2" ]]; then
		return $EQ
	fi

	local A=() B=()
	IFS='.-' read -r -a A <<<"$1"
	IFS='.-' read -r -a B <<<"$2"

	while [[ ${#A[@]} -lt 3 ]]; do
		A+=( '0' )
	done
	while [[ ${#B[@]} -lt 3 ]]; do
		B+=( '0' )
	done

	local i=0
	while [[ $i -lt ${#A[@]} && $i -lt ${#B[@]} ]]; do
		local AA=${A[$i]}
		local BB=${B[$i]}
		i=$((i + 1))
		if [[ "$AA" =~ ^[0-9]+$ ]]; then
			if ! [[ "$BB" =~ ^[0-9]+$ ]]; then
				# numeric A < non-numeric B
				return 1
			elif [[ $AA -gt $BB ]]; then
				return 0
			elif [[ $AA -lt $BB ]]; then
				return 1
			fi
		elif [[ "$BB" =~ ^[0-9]+$ ]]; then
			# non-numeric A > numeric B
			return 0
		elif [[ "$AA" > "$BB" ]]; then
			return 0
		elif [[ "$AA" < "$BB" ]]; then
			return 1
		fi
	done

	if [[ ${#A[@]} -eq ${#B[@]} ]]; then
		return $EQ
	elif [[ ${#A[@]} -eq 3 ]]; then
		# Something with no pre-release components > something with
		return 0
	elif [[ ${#B[@]} -eq 3 ]]; then
		# Something with pre-release components < something without
		return 1
	else
		# The thing with more pre-release components is greater.
		[[ ${#A[@]} -gt ${#B[@]} ]]
	fi
}
