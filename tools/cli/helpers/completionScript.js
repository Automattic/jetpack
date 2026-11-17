/**
 * Script for `jetpack completion`: yargs' own, plus name matches such as `pre`.
 *
 * compgen and `_describe` drop a candidate that does not start with the typed word.
 *
 * @return {string} Script for the shell named by `$SHELL`.
 */
export function completionScript() {
	const shell = process.env.SHELL ?? '';
	if ( shell.includes( 'zsh' ) || ( process.env.ZSH_NAME ?? '' ).includes( 'zsh' ) ) {
		return zshScript();
	}
	if ( shell.includes( 'fish' ) ) {
		return fishScript();
	}
	return bashScript();
}

/**
 * Bash completion script.
 *
 * @return {string} The script.
 */
function bashScript() {
	return `###-begin-jetpack-completions-###
#
# yargs command completion script
#
# Installation: jetpack completion >> ~/.bashrc
#    or jetpack completion >> ~/.bash_profile on OSX.
#
_jetpack_yargs_completions()
{
    local cur_word args type_list candidate prefixed=0

    cur_word="\${COMP_WORDS[COMP_CWORD]}"
    args=("\${COMP_WORDS[@]}")

    # ask yargs to generate completions.
    # see https://stackoverflow.com/a/40944195/7080036 for the spaces-handling awk
    mapfile -t type_list < <(jetpack --get-yargs-completions "\${args[@]}")
    for candidate in "\${type_list[@]}"; do
        if [[ $candidate == "$cur_word"* ]]; then
            prefixed=1
            break
        fi
    done

    if [[ $prefixed -eq 1 ]]; then
        mapfile -t COMPREPLY < <(compgen -W "$( printf '%q ' "\${type_list[@]}" )" -- "\${cur_word}" |
            awk '/ / { print "\\""$0"\\"" } /^[^ ]+$/ { print $0 }')
    else
        # compgen keeps only prefixes. A name match does not start with the typed word.
        COMPREPLY=("\${type_list[@]}")
    fi

    # if no match was found, fall back to filename completion
    if [ \${#COMPREPLY[@]} -eq 0 ]; then
      COMPREPLY=()
    fi

    return 0
}
complete -o bashdefault -o default -F _jetpack_yargs_completions jetpack
###-end-jetpack-completions-###`;
}

/**
 * Zsh completion script.
 *
 * @return {string} The script.
 */
function zshScript() {
	return `#compdef jetpack
###-begin-jetpack-completions-###
#
# yargs command completion script
#
# Installation: jetpack completion >> ~/.zshrc
#    or jetpack completion >> ~/.zprofile on OSX.
#
_jetpack_yargs_completions()
{
  local reply si=$IFS cur item name
  local -a direct=()
  IFS=$'\\n' reply=($(COMP_CWORD="$((CURRENT-1))" COMP_LINE="$BUFFER" COMP_POINT="$CURSOR" jetpack --get-yargs-completions "\${words[@]}"))
  IFS=$si
  if [[ \${#reply} -eq 0 ]]; then
    _default
    return
  fi
  cur=\${words[CURRENT]-}
  for item in "\${reply[@]}"; do
    name=\${item%%:*}
    if [[ -z $cur || \${name//\\\\:/:} == \${cur}* ]]; then
      direct+=("$item")
    fi
  done
  if [[ \${#direct} -gt 0 ]]; then
    _describe 'values' direct
    return
  fi
  # -M '' ignores a substring matcher, which would turn pre into s/premium-analytics.
  compadd -U -M '' -- "\${reply[@]}"
  if [[ \${#reply} -gt 1 && $compstate[insert] != menu && $compstate[insert] != automenu ]]; then
    compstate[insert]=''
    compstate[list]='list force'
  fi
}
if [[ "\${zsh_eval_context[-1]}" == "loadautofunc" ]]; then
  _jetpack_yargs_completions "$@"
else
  compdef _jetpack_yargs_completions jetpack
fi
###-end-jetpack-completions-###`;
}

/**
 * Fish filters candidates by prefix, so a name match is not offered there.
 *
 * @return {string} Fish completion script.
 */
function fishScript() {
	return `###-begin-jetpack-completions-###
#
# yargs command completion script
#
# Installation: jetpack completion > ~/.config/fish/completions/jetpack.fish
#
complete -f -c jetpack -a '(jetpack --get-yargs-completions (commandline -o)[2..-1])'
###-end-jetpack-completions-###`;
}
