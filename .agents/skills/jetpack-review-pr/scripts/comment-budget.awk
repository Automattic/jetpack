# Flags added comment blocks that exceed the AGENTS.md comment budget.
# Reads a unified diff on stdin; -v MAX=n sets the allowed prose lines (default 4).
#
# Counts PROSE only: delimiters, blank continuations and tag lines (@param, translators:,
# phpcs:ignore, ...) are mandatory scaffolding, so a compliant PHP docblock clears MAX without
# them. Output is a candidate list for human judgment, never a verdict.

BEGIN { if ( MAX == "" ) MAX = 4 }

function flush(   ) {
	if ( prose > MAX ) printf "%s:%d\t%d prose lines (%d total)\n", file, start, prose, run
	run = 0; prose = 0
}

/^\+\+\+ /	{ flush(); file = substr( $0, 7 ); sub( /^b\//, "", file ); next }
/^@@/		{ flush(); split( $0, h, "+" ); split( h[2], g, "," ); ln = g[1] + 0; next }
/^-/		{ next }

/^\+/ {
	t = substr( $0, 2 )
	sub( /^[[:space:]]+/, "", t )
	if ( t ~ /^(\/\/|\/\*|\*)/ ) {
		if ( run == 0 ) start = ln
		run++
		sub( /^(\/\/+|\/\*+|\*+\/?)[[:space:]]*/, "", t )
		if ( t != "" && t !~ /^@/ && t !~ /^(translators|phpcs|eslint|ts-expect|prettier|stylelint|webpack|istanbul|c8|jshint|codingStandards)/ ) prose++
	} else {
		flush()
	}
	ln++
	next
}

{ flush(); ln++ }
END { flush() }
