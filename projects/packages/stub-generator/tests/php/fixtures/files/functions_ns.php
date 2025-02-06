<?php

namespace Some\NS;

/**
 * A namespaced function.
 *
 * @param string $p1 Parameter 1.
 * @param array $p2 Parameter 2.
 * @return ?object Some object.
 */
function a_namespaced_function( $p1, $p2 ) {
	return (object) array(
		'p1' => $p1,
		'p2' => $p2,
	);
}
