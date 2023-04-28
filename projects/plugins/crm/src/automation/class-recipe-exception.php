<?php

namespace Automattic\Jetpack\CRM\Automation;

class Recipe_Exception extends \Exception {
    const INVALID_RECIPE                = 10;
	const RECIPE_REQUIRE_A_TRIGGER      = 11;
	const RECIPE_REQUIRE_A_INITIAL_STEP = 12;
}