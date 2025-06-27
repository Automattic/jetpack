<?php

/**
 * Plugin Name: Boost E2E Critical CSS Advanced Recommendations
 * Description: Force errors in the Critical CSS Advanced Recommendations
 * Plugin URI: https://github.com/automattic/jetpack
 * Author: Heart of Gold
 * Version: 1.0.0
 * Text Domain: jetpack
 *
 * @package automattic/jetpack
 */

add_action('template_redirect', function () {
    if (isset($_GET['cat']) && isset($_GET['jb-generate-critical-css'])) {
        header('HTTP/1.0 500 Internal Server Error');
        die();
    }
});
