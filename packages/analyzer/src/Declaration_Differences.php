<?php

namespace Automattic\Jetpack\Analyzer;

class Declaration_Differences {
	private $differences;
	// private $parser;

	function __construct() {
		// $this->parser       = ( new ParserFactory() )->create( ParserFactory::PREFER_PHP7 );
		$this->differences = array();
	}

	public function get() {
		return $this->differences;
	}

	public function add( $difference ) {
		$this->differences[] = $difference;
	}
}