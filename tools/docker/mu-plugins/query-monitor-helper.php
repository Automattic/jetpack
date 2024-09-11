<?php
/**
 * Plugin Name: Monorepo Query Monitor Helper
 * Description: Helps with debugging by providing better labels for Query Monitor.
 * Version: 1.0
 * Author: Automattic
 * Author URI: https://automattic.com/
 * Text Domain: jetpack
 *
 * @package automattic/jetpack
 *
 *
 * This file contains hooks for Query Monitor, which is a debugging tool for WordPress.
 * It allows you to see all the queries that are being run on your development environment.
 * It defines three filter hooks that modify how Query Monitor categorizes and displays components in its output:
 *
 *  * qm/component_type/unknown:
 *    This filter categorizes files as either 'plugin' or 'other' based on their file path.
 *	  files containing 'projects/plugins/jetpack' are marked as 'plugin', while those with 'projects/packages' are marked as 'other'.
 *  * qm/component_name/plugin:
 * 	  This filter renames components identified as plugins.
 *    If the file path contains 'projects/plugins/jetpack', it's labeled as 'Plugin: jetpack'.
 *  * qm/component_name/other:
 *    This filter renames components identified as 'other'.
 *    For files in the 'projects/packages/' directory, it extracts the package name from the file path
 *   and labels it as 'Package: connection'.
 *
 * @package automattic/jetpack
 */


add_filter('qm/component_type/unknown', function($type, $file, $name, $context) {
    if (strpos($file, 'projects/plugins') !== false) {
        return 'plugin';
    }
    if (strpos($file, 'projects/packages') !== false) {
        return 'other';
    }
    return $type;
}, 10, 4);

// Hook into qm/component_name/plugin
add_filter('qm/component_name/plugin', function($name, $file) {
    if (strpos($file, 'projects/plugins/') !== false) {
        $parts = explode('/', $file);
        $plugin_index = array_search('plugins', $parts);
        if ($plugin_index !== false && isset($parts[$plugin_index + 1])) {
            return 'Plugin: ' . $parts[$plugin_index + 1];
        }
    }
    return $name;
}, 10, 2);

// Hook into qm/component_name/package
add_filter('qm/component_name/other', function($name, $file) {
    if (strpos($file, 'projects/packages/') !== false) {
        $parts = explode('/', $file);
        $package_name = $parts[array_search('packages', $parts) + 1] ?? '';
        return 'Jetpack Package: ' . $package_name;
    }
    return $name;
}, 10, 2);
