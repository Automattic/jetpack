#!/usr/bin/env php
<?php
/**
 * Fails CI when an Admin_Menu::add_menu() call passes a position outside the named tiers.
 *
 * The call sites are spread across a dozen projects, so no one project's tests can see them all.
 *
 * @package automattic/jetpack
 */

/*
 * Namespaced because Phan analyzes every script in tools/ as one unit, where a bare `usage()`
 * collides with the identical helper in check-changelogger-use.php.
 */
namespace Automattic\Jetpack\Tools\AdminMenuPositions;

chdir( __DIR__ . '/../' );

/**
 * File that declares the tiers, read at runtime so this tool cannot drift from it.
 */
const TIERS_SOURCE = 'projects/packages/admin-ui/src/class-admin-menu.php';

/**
 * The sidebar's position tiers, by constant name.
 *
 * @return array<string,int>
 */
function tiers() {
	static $tiers = null;
	if ( null !== $tiers ) {
		return $tiers;
	}

	$source = is_readable( TIERS_SOURCE ) ? file_get_contents( TIERS_SOURCE ) : false;
	if ( false === $source ) {
		fprintf( STDERR, "Could not read %s.\n", TIERS_SOURCE );
		exit( 1 );
	}

	$tiers = array();
	preg_match_all( '/\bconst\s+(POSITION_\w+)\s*=\s*(-?\d+)\s*;/', $source, $matches, PREG_SET_ORDER );
	foreach ( $matches as $match ) {
		$tiers[ $match[1] ] = (int) $match[2];
	}

	// The upsell is spliced in by core after the sort, so no caller can claim its slot.
	unset( $tiers['POSITION_UPGRADE'] );

	if ( array() === $tiers ) {
		fprintf( STDERR, "Found no POSITION_* constants in %s.\n", TIERS_SOURCE );
		exit( 1 );
	}

	return $tiers;
}

/**
 * Zero-based index of $position in Admin_Menu::add_menu()'s signature.
 */
const POSITION_ARG_INDEX = 5;

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

		// Matching is lexical, so `use Admin_Menu as Foo` is missed. Same tradeoff as FeatureFlagNameSniff.
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
			'position' => position_of( $args ),
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
 * Reads the position out of a collected argument list.
 *
 * Spread and named arguments move it off its index, where reading that index would report an
 * off-tier position as omitted -- a silent pass, the one direction this tool must never fail in.
 *
 * @param string[] $args Normalized argument sources.
 * @return string Argument source, '' when omitted, or an unreadable marker.
 */
function position_of( array $args ) {
	foreach ( $args as $arg ) {
		if ( str_starts_with( $arg, '...' ) || preg_match( '/^\w+\s*:(?!:)/', $arg ) ) {
			return 'unreadable argument list, at ' . $arg;
		}
	}

	return $args[ POSITION_ARG_INDEX ] ?? '';
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

	if ( preg_match( '/(?:^|\\\\)(?:Admin_Menu|self|static)::(POSITION_\w+)$/', $position, $m ) ) {
		return isset( tiers()[ $m[1] ] ) ? $m[1] : null;
	}

	if ( preg_match( '/^-?\d+$/', $position ) ) {
		$name = array_search( (int) $position, tiers(), true );
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

// A guard that finds nothing has to fail loudly; passing would hide its own breakage.
if ( array() === $all ) {
	fprintf( STDERR, "Found no Admin_Menu::add_menu() call sites at all. The scan is broken.\n" );
	exit( 1 );
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
			implode( ', ', array_keys( tiers() ) )
		);
	}
}

fprintf(
	STDERR,
	"\nThe Jetpack submenu sorts alphabetically among items sharing a position, so any other\n" .
	"int silently drops that item out of the ordering. Pass no position at all unless the item\n" .
	"needs a specific tier: %s.\n",
	implode( ', ', array_keys( tiers() ) )
);

exit( 2 );
