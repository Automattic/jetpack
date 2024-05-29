<?php

namespace Some\NS;

function loadTemplate1( $name ) {
	require __DIR__ . "/templates/$name.php";
}

/**
 * @html-template-var 'ns/f2' $var
 */
function loadTemplate2( $name ) {
	$var = (object) array();
	require __DIR__ . "/templates/$name.php";
}

class LoaderClass {
	public function loadTemplate1( $name ) {
		require __DIR__ . "/templates/$name.php";
	}

	/**
	 * @html-template-var 'ns/c2' $var
	 */
	public function loadTemplate2( $name ) {
		$var = (object) array();
		require __DIR__ . "/templates/$name.php";
	}

	/**
	 * @html-template-var 'ns/c3' $var
	 * @html-template-var 'ns/c3' $var2
	 */
	private static function loadTemplate3( $name ) {
		$var = (object) array();
		require __DIR__ . "/templates/$name.php";
	}
}
