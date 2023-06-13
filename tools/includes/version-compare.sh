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

	local V1="${1%%+*}" V2="${2%%+*}"

	local A=() B=() i

	# First, compare the version parts.
	IFS='.' read -r -a A <<<"${V1%%-*}"
	IFS='.' read -r -a B <<<"${V2%%-*}"

	while [[ ${#A[@]} -lt ${#B[@]} ]]; do
		A+=( 0 )
	done
	while [[ ${#B[@]} -lt ${#A[@]} ]]; do
		B+=( 0 )
	done

	i=0
	while [[ $i -lt ${#A[@]} && $i -lt ${#B[@]} ]]; do
		local AA=${A[$i]}
		local BB=${B[$i]}
		i=$((i + 1))
		if [[ $AA -gt $BB ]]; then
			return 0
		elif [[ $AA -lt $BB ]]; then
			return 1
		fi
	done

	# Version parts were equal, check prerelease parts.

	if [[ "$V1" != *-* && "$V2" != *-* ]]; then
		# Neither has prerelease components, so they're equal
		return $EQ
	elif [[ "$V1" != *-* && "$V2" == *-* ]]; then
		# Something with no pre-release components > something with
		return 0
	elif [[ "$V1" == *-* && "$V2" != *-* ]]; then
		# Something with pre-release components < something without
		return 1
	fi

	IFS='.' read -r -a A <<<"${V1#*-}"
	IFS='.' read -r -a B <<<"${V2#*-}"

	i=0
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
	else
		# The thing with more pre-release components is greater.
		[[ ${#A[@]} -gt ${#B[@]} ]]
	fi
}
