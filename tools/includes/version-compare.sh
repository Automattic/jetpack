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

# Compute the difference between two version numbers, semver style.
#
# Note this is a bit looser than `pnpm semver`, as it accepts 4-part versions.
#
# @param $1 First version.
# @param $2 Second version.
# Outputs: equal, suffix, patch, minor, or major.
function version_diff {
	# Variable for the version_difference call
	local INCREMENT

	# Returning 0 if neither $1 > $2, nor $2 > $1
	if ! version_compare "$1" "$2" 1 && ! version_compare "$2" "$1" 1; then
		echo "equal"
	fi

	if version_compare "$1" "$2"; then

		# $1 is greater than $2
		version_get_increment "$2" "$1"
	else

		# $2 is greater than $1
		version_get_increment "$1" "$2"
	fi

	case "$INCREMENT" in
		"1")
			echo "suffix"
			;;
		"2")
			echo "patch"
			;;
		"3")
			echo "minor"
			;;
		"4")
			echo "major"
			;;
	esac
}

# Compute the increment needed to get from $1 to $2, semver style.
#
# Note this is a bit looser than `pnpm semver`, as it accepts 4-part versions.
#
# @param $1 First version.
# @param $2 Second version.
function version_get_increment {

	local V1="${1%%+*}" V2="${2%%+*}"

	local A=() B=() i DIFF

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

	# If AA is ahead of BB, we have found our difference.
	while [[ $i -lt ${#A[@]} && $i -lt ${#B[@]} ]]; do
		local AA=${A[$i]}
		local BB=${B[$i]}

		if [[ $AA -lt $BB ]]; then
			let DIFF="4 - $i"

			INCREMENT=$DIFF
			return
		fi
		i=$((i + 1))
	done

	# Version parts were equal, this means that the difference is the suffix.
	INCREMENT=1
}

# Returns true if the version is patch level, semver style. This function disregards string suffixes,
# so that 3.4.0-alpha would be considered as 3.4.0.
#
# @param $1 Version to check.
# @return 1 if no patch level, 0 if patch level.
function version_is_patch {
	local V1="${1%%+*}"

	local A=()

	# First, compare the version parts.
	IFS='.' read -r -a A <<<"${V1%%-*}"

	# Checking if it's a four point style release
	PATCH=${A[3]}

	# If it exists, it's a patch level version
	[[ -n "$PATCH" ]] && return 0

	# Getting the third element of the array
	PATCH=${A[2]}

	[[ -z "$PATCH" ]] && return 1

	[[ $PATCH -ne "0" ]]
}
