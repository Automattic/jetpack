#compdef {{name}}
# Tab completion for `{{name}}`, printed by `{{name}} completion`. Every TAB asks the CLI itself
# (`{{name}} --get-yargs-completions`), so the script holds no data and never needs regenerating.

_{{name}}() {
	local -a reply prefixes values
	local entry ret=1

	# yargs formats the candidates for the shell named by $SHELL, which may not be the one running.
	reply=( ${(f)"$( SHELL=zsh {{name}} --get-yargs-completions "${(@)words[1,CURRENT]}" 2>/dev/null )"} )
	for entry in "${reply[@]}"; do
		if [[ -z $entry ]]; then
			continue
		elif [[ $entry == */ ]]; then
			prefixes+=( "$entry" )
		else
			values+=( "$entry" )
		fi
	done

	# A `type/` prefix gets no trailing space, so the next TAB lists that type's projects.
	(( ${#prefixes} )) && _describe -t prefixes 'prefix' prefixes -S '' && ret=0
	(( ${#values} )) && _describe -t values 'value' values && ret=0
	(( ${#prefixes} + ${#values} )) || { _default && ret=0 }
	return ret
}

# Works both sourced from a startup file and autoloaded as `_{{name}}` from a directory on fpath.
if [[ ${zsh_eval_context[-1]} == loadautofunc ]]; then
	_{{name}} "$@"
else
	compdef _{{name}} {{name}}
fi
