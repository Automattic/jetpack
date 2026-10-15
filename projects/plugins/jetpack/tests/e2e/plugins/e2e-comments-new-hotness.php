<?php
/**
 * Plugin Name: Jetpack Comments E2E opt-in
 * Plugin URI: https://github.com/automattic/jetpack
 * Author: Jetpack Team
 * Version: 1.0.0
 * Text Domain: jetpack
 *
 * Loads the Jetpack Comments package in place of the legacy comment form.
 *
 * @package automattic/jetpack
 */

add_filter( 'jetpack_comments_new_hotness', '__return_true' );
