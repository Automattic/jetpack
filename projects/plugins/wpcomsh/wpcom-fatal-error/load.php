<?php
/**
 * Entry point for the WordPress.com fatal-error experience.
 *
 * Loads the module's three parts in dependency order: pure helpers first,
 * then the filter + template, then the signed-URL deactivation endpoint.
 *
 * Layout:
 *   fatal-error-helpers.php       Pure helpers (viewer detection, plugin
 *                                 identification, URL builders, error format).
 *   fatal-error-screen.php        Filter on wp_php_error_message + template.
 *   fatal-error-email.php         Filter on recovery_mode_email rewriting
 *                                 the admin notification copy.
 *   fatal-plugin-deactivator.php  Early-running endpoint that honors the
 *                                 signed deactivation URL the screen renders.
 *
 * @package wpcomsh
 */

// Dummy comment so PHPCS sees the above as a file comment.
require_once __DIR__ . '/fatal-error-helpers.php';
require_once __DIR__ . '/fatal-error-screen.php';
require_once __DIR__ . '/fatal-error-email.php';
require_once __DIR__ . '/fatal-error-logger.php';
require_once __DIR__ . '/fatal-plugin-deactivator.php';
