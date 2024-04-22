<?php
/**
 * Script to munge the phpunit-stubs.php to fix broken phpdocs in PHPUnit 9.6.
 *
 * @package automattic/jetpack-monorepo
 */

$stubs = file_get_contents( $argv[1] );

// Map various `@psalm` annotations.
$stubs = strtr(
	$stubs,
	array(
		'@psalm-assert '   => '@phan-assert ',
		// Can't do @psalm-assert-if-true unfortunately, see https://github.com/phan/phan/issues/3127
		'@psalm-param'     => '@phan-param',
		'@psalm-return'    => '@phan-return',
		'@psalm-template'  => '@phan-template',
		'@psalm-var'       => '@phan-var',
		'@psalm-immutable' => '@phan-side-effect-free', // https://psalm.dev/docs/annotating_code/supported_annotations/#psalm-immutable vs https://github.com/phan/phan/wiki/Annotating-Your-Source-Code#phan-side-effect-free-on-classes
	)
);

// Fix some bad method docs.
$stubs = preg_replace( '#^(\s*)\* @param mixed\[\] \$nextValues((?>[\s\S]*?\*/)\s*public function willReturn\(\$value, \.\.\.\$nextValues\))#m', '$1* @param mixed \$nextValues$2', $stubs );
$stubs = preg_replace( '#^(\s*)\* @param mixed\[\] \$arguments((?>[\s\S]*?\*/)\s*public function with\(\.\.\.\$arguments\))#m', '$1* @param mixed \$nextValues$2', $stubs );

// Phan doesn't track generics across `@return $this` properly. Rewrite them.
$stubs = preg_replace_callback(
	'#^\s*+(/\*(?>.*?\*/))\s+(?:final |abstract )*+class [A-Za-z_][A-Za-z0-9_]*+\s*+{(?:[^{}]*+{\s*+})*+[^{}]*+}#ms',
	function ( $m ) {
		if ( ! preg_match( '/@phan-template ([A-Za-z_][A-Za-z0-9_]*)\s/', $m[1], $t ) ) {
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
