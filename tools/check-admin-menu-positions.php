#!/usr/bin/env php
<?php
/**
 * Tool to check that Jetpack sidebar menu items register on one of the named position tiers.
 *
 * The Jetpack submenu sorts alphabetically by menu title, but only among items sharing a
 * position. An arbitrary int at a call site therefore opts that item out of the ordering
 * silently, which is how three separate curation efforts overwrote alphabetical order without
 * anyone noticing. No test suite catches it, because the call sites live in a dozen projects
 * and each one only tests itself.
 *
 * @package automattic/jetpack
 */

chdir( __DIR__ . '/../' );

/**
 * The sidebar's position tiers, by constant name.
 *
 * Keep in sync with the POSITION_* constants on Automattic\Jetpack\Admin_UI\Admin_Menu, except
 * POSITION_UPGRADE: the free-plan upsell is appended after the sort, through core rather than
 * through add_menu(), so nothing here should ever claim it.
 */
const TIERS = array(
	'POSITION_FIRST'          => -10,
	'POSITION_FIRST_FALLBACK' => -5,
	'POSITION_DEFAULT'        => 0,
	'POSITION_EXTERNAL'       => 100,
	'POSITION_LAST'           => 998,
);

/**
 * Path fragments to skip. Tests pass off-tier positions deliberately, to assert what happens.
 */
const SKIP = array( '/vendor/', '/jetpack_vendor/', '/node_modules/', '/tests/', '/build/', '/dist/' );

/**
 * Display usage information and exit.
 *
 * @return never
 */
function usage() {
	global $argv;
	echo <<<EOH
USAGE: {$argv[0]} [--list]

Checks that every Automattic\Jetpack\Admin_UI\Admin_Menu::add_menu() call in projects/ either
omits the \$position argument or passes one of the named tiers.

  --list    List every call site and its tier, not just the violations.

Exit codes:

 0: Every call site is on a tier.
 1: Execution failure of some kind.
 2: At least one call site passes an off-tier position.

EOH;
	exit( 1 );
}

$list = false;
foreach ( array_slice( $argv, 1 ) as $arg ) {
	if ( '--list' === $arg ) {
		$list = true;
	} else {
		usage();
	}
}

/**
 * Lists the PHP files to scan.
 *
 * Uses git rather than a directory walk so build output and Composer's installs, which are
 * ignored rather than absent, don't turn up copies of the same call site.
 *
 * @return string[] Repo-relative paths.
 */
function php_files() {
	$out = array();
	// --others picks up a newly added file that isn't staged yet, so a local run sees it too.
	exec( 'git ls-files -z --cached --others --exclude-standard -- projects', $lines, $status );
	if ( 0 !== $status ) {
		fprintf( STDERR, "Failed to list files with git.\n" );
		exit( 1 );
	}

	foreach ( explode( "\0", implode( "\n", $lines ) ) as $file ) {
		if ( '' === $file || ! str_ends_with( $file, '.php' ) ) {
			continue;
		}

		foreach ( SKIP as $fragment ) {
			if ( false !== strpos( "/$file", $fragment ) ) {
				continue 2;
			}
		}

		$out[] = $file;
	}

	return $out;
}

/**
 * Finds every Admin_Menu::add_menu() call in one file and reports the position each passes.
 *
 * Tokenizing rather than matching a regex, so a position inside a comment or a string can't
 * register as a call site and a multi-line call reports the line its arguments start on.
 *
 * @param string $file Repo-relative path.
 * @return array[] List of [ 'line' => int, 'position' => string ]; position is '' when omitted.
 */
function find_calls( $file ) {
	$tokens = token_get_all( (string) file_get_contents( $file ) );
	$calls  = array();
	$count  = count( $tokens );

	for ( $i = 0; $i < $count; $i++ ) {
		if ( ! is_array( $tokens[ $i ] ) || T_STRING !== $tokens[ $i ][0] || 'add_menu' !== $tokens[ $i ][1] ) {
			continue;
		}

		// Walk back over `::` to whatever names the class.
		$j = $i - 1;
		while ( $j >= 0 && is_array( $tokens[ $j ] ) && T_WHITESPACE === $tokens[ $j ][0] ) {
			--$j;
		}
		if ( $j < 0 || ! is_array( $tokens[ $j ] ) || T_DOUBLE_COLON !== $tokens[ $j ][0] ) {
			continue;
		}
		--$j;
		while ( $j >= 0 && is_array( $tokens[ $j ] ) && T_WHITESPACE === $tokens[ $j ][0] ) {
			--$j;
		}
		if ( $j < 0 || ! is_array( $tokens[ $j ] ) ) {
			continue;
		}

		$class = $tokens[ $j ][1];
		if ( 'self' !== $class && 'static' !== $class && ! preg_match( '/(^|\\\\)Admin_Menu$/', $class ) ) {
			continue;
		}

		$args = collect_args( $tokens, $i, $count );
		if ( null === $args ) {
			continue;
		}

		$calls[] = array(
			'line'     => $tokens[ $i ][2],
			'position' => $args[5] ?? '',
		);
	}

	return $calls;
}

/**
 * Collects the top-level arguments of the call whose name token sits at $i.
 *
 * @param array $tokens Token list from token_get_all().
 * @param int   $i      Index of the method-name token.
 * @param int   $count  Token count.
 * @return string[]|null Normalized argument sources, or null if no argument list follows.
 */
function collect_args( $tokens, $i, $count ) {
	$j = $i + 1;
	while ( $j < $count && is_array( $tokens[ $j ] ) && T_WHITESPACE === $tokens[ $j ][0] ) {
		++$j;
	}
	if ( $j >= $count || '(' !== $tokens[ $j ] ) {
		return null;
	}

	$args  = array();
	$cur   = '';
	$depth = 0;

	for ( ++$j; $j < $count; $j++ ) {
		$token = $tokens[ $j ];

		if ( is_array( $token ) ) {
			// Comments and whitespace are not part of the argument's value.
			if ( T_WHITESPACE === $token[0] || T_COMMENT === $token[0] || T_DOC_COMMENT === $token[0] ) {
				$cur .= ' ';
				continue;
			}
			$cur .= $token[1];
			continue;
		}

		if ( '(' === $token || '[' === $token ) {
			++$depth;
		} elseif ( ')' === $token || ']' === $token ) {
			if ( ')' === $token && 0 === $depth ) {
				$args[] = trim( $cur );
				break;
			}
			--$depth;
		} elseif ( ',' === $token && 0 === $depth ) {
			$args[] = trim( $cur );
			$cur    = '';
			continue;
		}

		$cur .= $token;
	}

	// A trailing comma leaves an empty final argument.
	if ( array() !== $args && '' === end( $args ) ) {
		array_pop( $args );
	}

	return $args;
}

/**
 * Decides whether a position argument names a tier.
 *
 * @param string $position Normalized argument source; '' when the argument was omitted.
 * @return string|null Tier name, or null when the position is off-tier.
 */
function tier_for( $position ) {
	if ( '' === $position || 0 === strcasecmp( 'null', $position ) ) {
		return 'omitted';
	}

	if ( preg_match( '/^(?:Admin_Menu|self|static)::(POSITION_\w+)$/', $position, $m ) ) {
		return isset( TIERS[ $m[1] ] ) ? $m[1] : null;
	}

	if ( preg_match( '/^-?\d+$/', $position ) ) {
		$name = array_search( (int) $position, TIERS, true );
		return false === $name ? null : $name;
	}

	return null;
}

$violations = array();
$all        = array();

foreach ( php_files() as $file ) {
	foreach ( find_calls( $file ) as $call ) {
		$tier  = tier_for( $call['position'] );
		$entry = array(
			'where'    => $file . ':' . $call['line'],
			'position' => '' === $call['position'] ? '(omitted)' : $call['position'],
			'tier'     => $tier,
		);

		$all[] = $entry;
		if ( null === $tier ) {
			$violations[] = $entry;
		}
	}
}

if ( $list ) {
	foreach ( $all as $entry ) {
		printf( "%-78s %-28s %s\n", $entry['where'], $entry['position'], $entry['tier'] ?? 'OFF-TIER' );
	}
	echo "\n";
}

if ( array() === $violations ) {
	printf( "All %d Admin_Menu::add_menu() call sites are on a position tier.\n", count( $all ) );
	exit( 0 );
}

fprintf( STDERR, "Found %d Admin_Menu::add_menu() call site(s) passing an off-tier position:\n\n", count( $violations ) );
foreach ( $violations as $entry ) {
	fprintf( STDERR, "  %s\n    passes: %s\n", $entry['where'], $entry['position'] );
	if ( getenv( 'GITHUB_ACTIONS' ) ) {
		list( $path, $line ) = explode( ':', $entry['where'] );
		printf(
			"::error file=%s,line=%s::Off-tier sidebar position `%s`. Pass no position to sort alphabetically, or use one of: %s.\n",
			$path,
			$line,
			$entry['position'],
			implode( ', ', array_keys( TIERS ) )
		);
	}
}

fprintf(
	STDERR,
	"\nThe Jetpack submenu sorts alphabetically among items sharing a position, so any other\n" .
	"int silently drops that item out of the ordering. Pass no position at all unless the item\n" .
	"needs a specific tier: %s.\n",
	implode( ', ', array_keys( TIERS ) )
);

exit( 2 );
