<?php

use Dummy\B;
use Dummy\A;

class Foo {
	function xyz( $a ) {
		return $a ?? "undefined";
	}
}
