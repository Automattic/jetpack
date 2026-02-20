<?php
/**
 * Script to munge the phpunit-stubs.php to fix broken phpdocs in PHPUnit 11.5.
 *
 * @package automattic/jetpack-monorepo
 */

$stubs = file_get_contents( $argv[1] );

// Map various `@psalm` and `@phpstan` annotations.
$stubs = strtr(
	$stubs,
	array(
		'@phpstan-assert '  => '@phan-assert ',
		// Can't do @phpstan-assert-if-true unfortunately, see https://github.com/phan/phan/issues/3127
		// Can't do @phpstan-import-type either?
		'@phpstan-type '    => '@phan-type ',
		// Phpstan apparently allows asserting "=Foo" versus "Foo", with the difference being that with "=Foo" does not imply "!Foo" when the call throws. Phan doesn't make that assumption in any case.
		'@phpstan-assert =' => '@phan-assert ',

		'@psalm-return'     => '@phan-return',
		'@psalm-var'        => '@phan-var',
		'@psalm-immutable'  => '@phan-side-effect-free', // https://psalm.dev/docs/annotating_code/supported_annotations/#psalm-immutable vs https://github.com/phan/phan/wiki/Annotating-Your-Source-Code#phan-side-effect-free-on-classes
	)
);

// PHPunit now has a TestDoubleBuilder, which is not itself generic but is extended by MockBuilder and falls to the same bug. Sigh.
// Make it pretend to be generic, then the bit below will apply to it too.
$stubs = preg_replace(
	'#^\s*\*/\s+abstract class TestDoubleBuilder\s#ms',
	" * @template MockedType\n$0",
	$stubs
);
if ( $stubs === null ) {
	throw new RuntimeException( preg_last_error_msg() );
}

// Also it seems to get confused by TestStubBuilder using "StubbedType" rather than "MockedType". `@inherits` doesn't seem to help.
$stubs = preg_replace( '/\bStubbedType\b/', 'MockedType', $stubs );
if ( $stubs === null ) {
	throw new RuntimeException( preg_last_error_msg() );
}

// Phan doesn't track generics across `@return $this` properly. Rewrite them.
// Possibly fixed in Phan v6? https://github.com/phan/phan/issues/4849
$stubs = preg_replace_callback(
	'#^\s*+(/\*(?>.*?\*/))\s+(?:final |abstract |readonly )*+class [A-Za-z_][A-Za-z0-9_]*+\s*+{(?:[^{}]*+{\s*+})*+[^{}]*+}#ms',
	function ( $m ) {
		if ( ! preg_match( '/@(?:phan-)?template ([A-Za-z_][A-Za-z0-9_]*)\s/', $m[1], $t ) ) {
			return $m[0];
		}
		return preg_replace( '#^(\s*)\* @return (self|static|\$this)$#m', "$0\n$1* @phan-return $2<{$t[1]}>", $m[0] );
	},
	$stubs
);
if ( $stubs === null ) {
	throw new RuntimeException( preg_last_error_msg() );
}

file_put_contents( $argv[1], $stubs );
