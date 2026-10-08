<?php
/**
 * Bootstrap the legacy guideline compatibility and Knowledge migration feature.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

require_once __DIR__ . '/class-legacy-guideline-rest-controller.php';
require_once __DIR__ . '/class-knowledge-migration.php';

Knowledge_Migration::init();
