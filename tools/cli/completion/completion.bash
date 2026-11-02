# Tab completion for `{{name}}`, printed by `{{name}} completion`. Every TAB asks the CLI itself
# (`{{name}} --get-yargs-completions`), so the script holds no data and never needs regenerating.
# Needs bash 4 or later.

_{{name}}() {
	local -a reply
	local IFS=$'\n'

	# yargs formats the candidates for the shell named by $SHELL, which may not be the one running.
	mapfile -t reply < <( SHELL=bash {{name}} --get-yargs-completions "${COMP_WORDS[@]}" 2>/dev/null )
	if (( ${#reply[@]} == 0 )); then
		return 0
	fi
	mapfile -t COMPREPLY < <( compgen -W "$( printf '%q\n' "${reply[@]}" )" -- "${COMP_WORDS[COMP_CWORD]}" )

	# A `type/` prefix gets no trailing space, so the next TAB lists that type's projects.
	if (( ${#COMPREPLY[@]} == 1 )) && [[ ${COMPREPLY[0]} == */ ]]; then
		compopt -o nospace
	fi
}

complete -o bashdefault -o default -F _{{name}} {{name}}
