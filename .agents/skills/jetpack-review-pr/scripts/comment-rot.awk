# Candidates for the two comment problems a length budget cannot see, both from
# AGENTS.md § Comments: the same explanation written in more than one place, and
# provenance that rots.
#
# Neither depends on length — the offenders in the calibration corpus are one or
# two lines each — so nothing here is gated on comment length. The only size
# test is a substance floor (min_chars/min_words) that keeps `// Arrange.` and
# `// See above.` out of the duplicate report; it rejects boilerplate, never a
# real explanation.
#
# Usage, from the monorepo root (needs no checkout of the PR, no build):
#   gh pr diff <PR> | awk -f .agents/skills/jetpack-review-pr/scripts/comment-rot.awk
#
# Knobs: -v min_chars=40 -v min_words=6                 verbatim substance floor
#        -v min_phrase_words=8 -v min_phrase_chars=45   shared-phrase floor
#        -v show_rules=1                                list the rot signals and exit
#
# Output is CANDIDATES, not findings. Every line needs a judgment call: which
# copy owns the explanation, whether the provenance is actually load-bearing.
# Exit status is always 0 — an empty report is the common, healthy case.

BEGIN {
	if ( min_chars == "" ) min_chars = 40
	if ( min_words == "" ) min_words = 6
	if ( min_phrase_words == "" ) min_phrase_words = 8
	if ( min_phrase_chars == "" ) min_phrase_chars = 45

	# Files we read comments out of. Everything else — .md, whose `*` bullets and
	# `#` headings are not comments; .json; .snap; changelog entries — is skipped.
	code_ext = "php|js|jsx|ts|tsx|mjs|cjs|scss|css|sass|py|sh|bash|rb|go|java|kt|swift|c|h|cpp|hpp|awk"
	hash_ext = "php|py|sh|bash|rb|awk"

	# Generated or vendored trees: comments there are not this PR's prose.
	skip_path = "(^|/)(node_modules|vendor|jetpack_vendor|dist|build|coverage)/|\\.min\\.(js|css)$"

	# Load-bearing annotations that are supposed to repeat verbatim.
	annot = "^(@|phpcs:|phpstan-|psalm-|phan-|eslint-|stylelint-|prettier-|jshint|ts-|jsx-|istanbul |c8 |v8 |translators:|codingstandardsignore|spdx|copyright|licensed under)"

	nrules = 0
	rule( "history", "the tree's former state — true only until the next reader arrives", \
		"before this (pr|change|patch|commit|fix|branch)|prior to this|used to |we used to|previously[ ,]|formerly|originally[ ,]|until recently|up until|the old (code|implementation|version|way|behaviou?r)|an earlier version|we (tried|attempted)" )
	# No "would …" here on purpose. It reads like a rejected alternative and is
	# almost always an invariant instead ("turning this on would have to publish
	# the site"): it was every false positive in the negative corpus, and cost
	# nothing to drop — the real offenders match on the past tense.
	rule( "rejected", "an alternative the tree does not have — describes code no reader can see", \
		"caused (a|an|the|~|[0-9])|led to|resulted in|does ?n.t work|did ?n.t work|we could have|the (naive|obvious) (approach|version|fix)|first attempt|rejected because" )
	rule( "citation", "an upstream file-and-line pointer — drifts on the next upstream edit", \
		"[a-z0-9_./-]+\\.(php|js|jsx|ts|tsx|mjs|cjs|scss|css|py|rb|go|java|c|h|inc)(:| line |#l)[0-9]+|line [0-9]+ (of|in)|#l[0-9]+" )
	rule( "numbers", "a measurement or count — drifts the moment the thing it counts changes", \
		"~ ?[0-9]|[0-9]+ ?x (faster|slower)|(about|roughly|approximately|around|takes|costs|saves) [0-9]|[0-9]+[km]\\+|[0-9,]+ (tests?|mutants?|callers?|call sites?|occurrences?|instances?|queries|round-?trips?)" )
	rule( "pinned", "true at authoring time only — with no link to re-check it against", \
		"at the time of (writing|this)|as of (today|[0-9]{4}|php|wp|wordpress|node|react|version)" )

	if ( show_rules ) {
		print "comment-rot.awk rot signals:"
		for ( i = 1; i <= nrules; i++ ) printf "  %-9s %s\n             %s\n", rname[i], rwhy[i], rpat[i]
		done = 1
		exit 0
	}
}

function rule( n, why, pat ) {
	nrules++; rname[nrules] = n; rwhy[nrules] = why; rpat[nrules] = pat
}

# --- diff bookkeeping -------------------------------------------------------

/^\+\+\+ / {
	flush_block()
	path = substr( $0, 5 )
	sub( /^b\//, "", path )
	sub( /\t.*$/, "", path )
	ext = ""
	if ( match( path, /\.[A-Za-z0-9]+$/ ) ) ext = tolower( substr( path, RSTART + 1, RLENGTH - 1 ) )
	interesting = ( ext ~ ( "^(" code_ext ")$" ) ) && ( path !~ skip_path )
	hashes      = ( ext ~ ( "^(" hash_ext ")$" ) )
	next
}

/^@@ / {
	# @@ -old,n +new,n @@ — only the post-image is numbered here.
	flush_block()
	# Match the +N field directly: git appends the enclosing declaration after the
	# second @@, and a `+` in it (`.foo + .bar {`, `f( $a + $b )`) defeats a greedy
	# strip. One short of the hunk's first line, because every consumer below
	# increments before reading.
	if ( match( $0, /\+[0-9]+/ ) ) lineno = substr( $0, RSTART + 1, RLENGTH - 1 ) + 0 - 1
	next
}

!interesting { next }

/^-/  { next }
/^\\/ { next }
/^ /  { flush_block(); lineno++; next }

/^\+/ {
	raw = substr( $0, 2 )
	lineno++
	text = comment_body( raw )
	if ( text == "" ) { flush_block(); next }

	low = tolower( text )
	if ( low ~ annot ) { flush_block(); next }

	add_to_block( text )
	if ( record_dup( low, text ) ) blk_recorded = 1
}

# --- comment extraction -----------------------------------------------------

# The prose of a whole-line comment, or "" if the line is not one. Trailing
# comments (`foo(); // note`) are deliberately out of scope: separating them
# from `https://` and from `//` inside a string is guesswork, and guesswork is
# how a check earns the reputation that gets it switched off.
function comment_body( s,   t ) {
	sub( /^[ \t]+/, "", s )
	if ( substr( s, 1, 3 ) == "/**" )      t = substr( s, 4 )
	else if ( substr( s, 1, 2 ) == "//" )  t = substr( s, 3 )
	else if ( substr( s, 1, 2 ) == "/*" )  t = substr( s, 3 )
	else if ( substr( s, 1, 2 ) == "* " || s == "*" ) t = substr( s, 2 )
	else if ( hashes && substr( s, 1, 1 ) == "#" ) t = substr( s, 2 )
	else return ""

	sub( /\*\/[ \t]*$/, "", t )
	gsub( /[ \t]+/, " ", t )
	sub( /^ +/, "", t ); sub( / +$/, "", t )
	return t
}

# --- rot signals ------------------------------------------------------------

# Rot is matched against the whole comment, not the line: the give-away phrase
# routinely straddles a line break, and a reviewer cannot propose a shorter
# version from a fragment anyway.
function add_to_block( text ) {
	if ( blk_text != "" && blk_file == path && lineno == blk_end + 1 ) {
		blk_text = blk_text " " text
		blk_end  = lineno
		return
	}
	flush_block()
	blk_file = path; blk_start = lineno; blk_end = lineno; blk_text = text
}

function flush_block(   i, low, sigs ) {
	if ( blk_text == "" ) return
	low  = tolower( blk_text )
	sigs = ""
	for ( i = 1; i <= nrules; i++ ) if ( low ~ rpat[i] ) sigs = sigs "" ( sigs == "" ? "" : "," ) rname[i]
	if ( sigs != "" ) {
		nrot++
		rot_at[nrot]  = blk_file ":" blk_start "" ( blk_end > blk_start ? "-" blk_end : "" )
		rot_sig[nrot] = sigs
		rot_txt[nrot] = blk_text
	}
	nblk++
	blk_at[nblk]  = blk_file ":" blk_start "" ( blk_end > blk_start ? "-" blk_end : "" )
	blk_norm[nblk] = norm( blk_text )
	blk_had_dup[nblk] = blk_recorded; blk_recorded = 0
	blk_text = ""
}

function norm( t,   k ) {
	k = tolower( t )
	gsub( /[^a-z0-9']+/, " ", k )
	sub( /^ +/, "", k ); sub( / +$/, "", k )
	return k
}

# --- shared phrasing --------------------------------------------------------

# Verbatim line matching cannot see an explanation reworded across different
# line breaks, even when it reuses a whole distinctive clause. Index every
# window of `min_phrase_words` consecutive words and report any window two
# different comments share: a run that long is reuse, not coincidence.
function shared_phrases(   i, j, k2, w, nw, key, ids, nid, sig, a, b, tmp, allsame, dupped ) {
	for ( i = 1; i <= nblk; i++ ) {
		nw = split( blk_norm[i], w, " " )
		for ( j = 1; j + min_phrase_words - 1 <= nw; j++ ) {
			key = w[j]
			for ( k2 = 1; k2 < min_phrase_words; k2++ ) key = key " " w[j + k2]
			if ( length( key ) < min_phrase_chars ) continue
			if ( !( key in owners ) ) { owners[key] = i; continue }
			if ( ( " " owners[key] " " ) !~ ( " " i " " ) ) owners[key] = owners[key] " " i
		}
	}
	# One idea reworded across N comments produces many overlapping windows. Group
	# by the set of comments a window spans and keep the longest window per set, so
	# the report carries one entry per idea rather than one per window or per pair.
	for ( key in owners ) {
		nid = split( owners[key], ids, " " )
		if ( nid < 2 ) continue
		allsame = 1
		for ( a = 2; a <= nid; a++ ) if ( blk_norm[ids[a]] != blk_norm[ids[1]] ) allsame = 0
		# Skip only what the verbatim report really has: its substance floor is per
		# line, so a block of individually-short lines fails it and misses both.
		if ( allsame ) {
			dupped = 1
			for ( a = 1; a <= nid; a++ ) if ( !blk_had_dup[ids[a]] ) dupped = 0
			if ( dupped ) continue
		}
		sig = owners[key]
		sig_same[sig] = allsame
		# Tie on length: break it lexicographically, or the array walk order decides.
		if ( length( key ) > length( best[sig] ) || ( length( key ) == length( best[sig] ) && key < best[sig] ) ) best[sig] = key
	}
	nsig = 0
	for ( sig in best ) sig_list[++nsig] = sig
	# That walk has no defined order, so sort before reporting — otherwise the
	# phrase quoted and the candidate order both vary by awk implementation.
	for ( a = 2; a <= nsig; a++ ) {
		tmp = sig_list[a]
		for ( b = a - 1; b >= 1 && sig_gt( sig_list[b], tmp ); b-- ) sig_list[b + 1] = sig_list[b]
		sig_list[b + 1] = tmp
	}
	# A shorter window often spans a subset of a longer one's comments. Reporting
	# both says the same thing twice, so keep only the widest set.
	npair = 0
	for ( a = 1; a <= nsig; a++ ) {
		if ( subsumed( sig_list[a], sig_list, nsig, a ) ) continue
		npair++
		pair_key[npair]   = best[sig_list[a]]
		pair_sites[npair] = sig_list[a]
		pair_same[npair]  = sig_same[sig_list[a]]
	}
}

# Orders two site sets by their first comment, whose number leads the string.
function sig_gt( x, y ) {
	if ( ( x + 0 ) != ( y + 0 ) ) return ( x + 0 ) > ( y + 0 )
	return x > y
}

function subsumed( sig, list, n, self,   b, i, nid, ids, ok ) {
	nid = split( sig, ids, " " )
	for ( b = 1; b <= n; b++ ) {
		if ( b == self || list[b] == sig ) continue
		ok = 1
		for ( i = 1; i <= nid; i++ ) if ( ( " " list[b] " " ) !~ ( " " ids[i] " " ) ) { ok = 0; break }
		if ( ok ) return 1
	}
	return 0
}

# --- repeated explanations --------------------------------------------------

# Key on the word sequence with case, punctuation and spacing normalised away:
# still an exact match, just not defeated by a backtick or a full stop. The
# skill's "Known limitation" note says why this stops short of paraphrase.
function record_dup( low, text,   key, words, junk ) {
	if ( length( text ) < min_chars ) return 0
	key = low
	gsub( /[^a-z0-9]+/, " ", key )
	sub( /^ +/, "", key ); sub( / +$/, "", key )
	words = split( key, junk, " " )
	if ( words < min_words ) return 0

	if ( !( key in dup_n ) ) {
		dup_n[key]   = 0
		dup_txt[key] = text
		dup_order[++ndup] = key
	}
	dup_n[key]++
	dup_where[key] = dup_where[key] "" ( dup_n[key] > 1 ? "\n" : "" ) path ":" lineno
	seen_at[path ":" lineno] = key
	return 1
}

function root_of( k,   guard ) {
	guard = 0
	while ( ( k in absorbed ) && guard++ < 64 ) k = absorbed[k]
	return k
}

# A 2-line comment yields 2 duplicate keys. When every site of key B sits one
# line below a site of the same key A, B is A's continuation, not a second
# finding — fold it in so one duplicated comment reports as one candidate.
function fold_continuations(   i, j, k, n, sites, prev, cand, ok, p ) {
	for ( i = 1; i <= ndup; i++ ) {
		k = dup_order[i]
		if ( dup_n[k] < 2 ) continue
		n = split( dup_where[k], sites, "\n" )
		cand = ""; ok = 1
		for ( j = 1; j <= n; j++ ) {
			prev = sites[j]
			sub( /:[0-9]+$/, "", prev )
			prev = prev ":" ( sitenum( sites[j] ) - 1 )
			if ( !( prev in seen_at ) ) { ok = 0; break }
			p = root_of( seen_at[prev] )
			if ( p == k ) { ok = 0; break }
			if ( cand == "" ) cand = p
			else if ( cand != p ) { ok = 0; break }
		}
		if ( ok && cand != "" && dup_n[cand] >= 2 ) {
			absorbed[k] = cand
			extra[cand]++
		}
	}
}

function sitenum( s,   t ) {
	t = s
	sub( /^.*:/, "", t )
	return t + 0
}

END {
	if ( done ) exit 0
	flush_block()
	fold_continuations()

	nr = 0
	for ( i = 1; i <= ndup; i++ ) {
		k = dup_order[i]
		if ( dup_n[k] < 2 || ( k in absorbed ) ) continue
		out_key[++nr] = k
	}

	print "comment-rot.awk — CANDIDATES ONLY. Each needs a judgment call before it is a finding."
	print ""
	print "## Repeated explanation — " nr " candidate(s)"
	if ( nr == 0 ) print "  none"
	for ( i = 1; i <= nr; i++ ) {
		k = out_key[i]
		printf "\n%d. %d copies%s\n   \"%s\"\n", i, dup_n[k], \
			( extra[k] ? " (+" extra[k] " continuation line(s), same sites)" : "" ), dup_txt[k]
		n = split( dup_where[k], sites, "\n" )
		for ( j = 1; j <= n; j++ ) print "   - " sites[j]
	}

	shared_phrases()
	print ""
	print "## Shared phrasing — " npair + 0 " candidate(s)"
	if ( npair + 0 == 0 ) print "  none"
	for ( i = 1; i <= npair; i++ ) {
		n = split( pair_sites[i], sites, " " )
		printf "\n%d. %d comments reuse \"…%s…\"%s\n", i, n, pair_key[i], \
			( pair_same[i] ? ", identical but under the verbatim floor" : ", reworded around it" )
		for ( j = 1; j <= n; j++ ) print "   - " blk_at[sites[j]]
	}

	print ""
	print "## Provenance that rots — " nrot + 0 " candidate(s)"
	if ( nrot + 0 == 0 ) print "  none"
	for ( i = 1; i <= nrot; i++ ) {
		t = rot_txt[i]
		if ( length( t ) > 400 ) t = substr( t, 1, 400 ) " […]"
		printf "\n%d. [%s] %s\n   \"%s\"\n", i, rot_sig[i], rot_at[i], t
	}
}
