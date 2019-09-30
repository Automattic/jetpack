<?php

namespace Automattic\Jetpack\Analyzer\Differences;

interface Invocation_Warner {
	public function find_invocation_warnings( $invocation, $warnings );
}
