<?php
/**
 * Jetpack Scan features that show up on the jetpack admin side.
 * - Adds a admin bar notice when the site has threats.
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Scan;

require_once 'class-admin-bar-notice.php';

Admin_Bar_Notice::instance();
