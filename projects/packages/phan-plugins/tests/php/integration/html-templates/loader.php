<?php

function loadTemplate1( $name ) {
	require __DIR__ . "/templates/$name.php";
}

/**
 * @html-template-var 'f2' $var
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
	 * @html-template-var 'c2' $var
	 */
	public function loadTemplate2( $name ) {
		$var = (object) array();
		require __DIR__ . "/templates/$name.php";
	}

	/**
	 * @html-template-var 'c3' $var
	 * @html-template-var 'c3' $var2
	 */
	private static function loadTemplate3( $name ) {
		$var = (object) array();
		require __DIR__ . "/templates/$name.php";
	}

	/**
	 * @html-template-var bogus $i1
	 * @html-template-var
	 * @html-template-var string
	 * @html-template-var string i2
	 * @html-template-var 'c3' $var
	 */
	private static function invalidVars( $name ) {
		$var = (object) array();
		require __DIR__ . "/templates/$name.php";
	}
}
