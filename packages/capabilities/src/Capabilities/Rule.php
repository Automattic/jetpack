<?php

namespace Automattic\Jetpack\Capabilities;

interface Rule {
	function check( ...$args ) : bool;
}
