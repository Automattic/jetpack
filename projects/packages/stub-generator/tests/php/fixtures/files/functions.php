<?php

/**
 * A function.
 *
 * @param string $p1 Parameter 1.
 * @param array $p2 Parameter 2.
 * @return ?object Some object.
 */
function a_function( $p1, $p2 ) {
	return (object) array(
		'p1' => $p1,
		'p2' => $p2,
	);
}

/**
 * Another function.
 *
 * @return never
 * @throws Exception Always.
 */
function another_function() {
	throw new Exception( 'Nope!' );
}

// This function has no docs.
function undocumented_function( $args ) {
	var_dump( $args );
}
