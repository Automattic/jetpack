<?php
/**
 * Adds preprocessor functionality to Custom CSS
 *
 * @package Jetpack
 */

use ScssPhp\ScssPhp\Compiler as Scss_Compiler;

/**
 * CSS preprocessor registration.
 *
 * To add a new preprocessor (or replace an existing one), hook into the
 * jetpack_custom_css_preprocessors filter and add an entry to the array
 * that is passed in.
 *
 * Format is:
 * $preprocessors[ UNIQUE_KEY ] => array( 'name' => 'Processor name', 'callback' => [processing function] );
 *
 * The callback function accepts a single string argument (non-CSS markup) and returns a string (CSS).
 *
 * @param array $preprocessors The list of preprocessors added thus far.
 * @return array
 */
function jetpack_register_css_preprocessors( $preprocessors ) {
	$preprocessors['less'] = array(
		'name'     => 'LESS',
		'callback' => 'jetpack_less_css_preprocess',
	);

	$preprocessors['sass'] = array(
		'name'     => 'Sass (SCSS Syntax)',
		'callback' => 'jetpack_sass_css_preprocess',
	);

	return $preprocessors;
}

add_filter( 'jetpack_custom_css_preprocessors', 'jetpack_register_css_preprocessors' );

/**
 * Passes CSS to LESS processor.
 *
 * @param string $less LESS code.
 *
 * @return false|string Resulting CSS.
 */
function jetpack_less_css_preprocess( $less ) {
	require_once dirname( __FILE__ ) . '/preprocessors/lessc.inc.php';

	$compiler = new lessc();

	try {
		return $compiler->compile( $less );
	} catch ( Exception $e ) {
		return $less;
	}
}

/**
 * Passes CSS to SASS processor.
 *
 * @param string $sass SASS code.
 *
 * @return string Resulting CSS.
 */
function jetpack_sass_css_preprocess( $sass ) {
	$compiler = new Scss_Compiler();
	$compiler->setFormatter( 'ScssPhp\ScssPhp\Formatter\Expanded' );

	try {
		return $compiler->compile( $sass );
	} catch ( Exception $e ) {
		return $sass;
	}
}
