# Flags added comment blocks that exceed the AGENTS.md comment budget.
# Reads a unified diff on stdin; -v MAX=n sets the allowed prose lines (default 4).
#
# Counts prose only, because the scaffolding a compliant docblock cannot avoid
# (delimiters, blank continuations, "@param", "translators:") would clear MAX on its own.

BEGIN { if ( MAX == "" ) MAX = 4 }

function flush(   ) {
	if ( prose > MAX ) printf "%s:%d\t%d prose lines (%d total)\n", file, start, prose, run
	run = 0; prose = 0
}

# "*" and "#" only open a comment in languages that say so: otherwise they are markdown
# bullets, CSS selectors and JS private fields. Extension is the only signal a diff carries.
function classify( f,   e ) {
	e = f
	sub( /^.*\//, "", e )
	cstyle = ( e ~ /\.(php|js|jsx|ts|tsx|mjs|cjs|css|scss|sass|less|svelte|vue|java|go|rs|swift|kt|c|h|cpp)$/ )
	hash = ( e ~ /\.(php|sh|bash|zsh|yml|yaml|py|rb|pl|toml|ini|conf|neon|env|awk)$/ || e ~ /^(Dockerfile|Makefile)/ )
}

# Track an open /* */ so a bare "*" is read as a continuation, not as whatever else it means.
function scan( s ) { if ( s ~ /\/\*/ ) inblock = 1; if ( s ~ /\*\// ) inblock = 0 }

/^\+\+\+ /	{ flush(); inblock = 0; file = substr( $0, 7 ); sub( /^b\//, "", file ); classify( file ); next }
/^@@/		{ flush(); inblock = 0; split( $0, h, "+" ); split( h[2], g, "," ); ln = g[1] + 0; next }
/^-/		{ next }

/^\+/ {
	t = substr( $0, 2 )
	sub( /^[[:space:]]+/, "", t )

	# A hunk can open mid-docblock, leaving inblock unset, so accept the "* " continuation shape too.
	if ( ( cstyle && t ~ /^(\/\/|\/\*)/ ) ||
		( cstyle && t ~ /^\*/ && ( inblock || t == "*" || t ~ /^\*[[:space:]]/ || t ~ /^\*\// ) ) ||
		( hash && t ~ /^#/ && t !~ /^#(!|\[)/ ) ) {
		if ( run == 0 ) start = ln
		run++
		scan( t )
		sub( /^(\/\/+|\/\*+|\*+\/?|#+)[[:space:]]*/, "", t )
		if ( t != "" && t !~ /^@/ && t !~ /^(translators:|phpcs:|eslint-|ts-expect-error|ts-ignore|prettier-ignore|stylelint-|webpack[A-Za-z]+[[:space:]]*:|istanbul[[:space:]]+ignore|c8[[:space:]]+ignore|jshint[[:space:]]+ignore|codingStandards)/ ) prose++
	} else {
		scan( t )
		flush()
	}
	ln++
	next
}

{ flush(); scan( substr( $0, 2 ) ); ln++ }
END { flush() }
