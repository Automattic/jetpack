<?php
/**
 * Knowledge test environment.
 *
 * @package automattic/jetpack-knowledge
 */

require_once __DIR__ . '/../../vendor/autoload.php';

define( 'WP_DEBUG', true );
// Avoid an option lookup before the fresh SQLite database has been installed.
define( 'WP_CONTENT_URL', 'http://anything.example/wp-content' );
define( 'WP_SITEURL', 'http://anything.example' );

// SQLite's PHP 8.5 deprecation occurs before isolated tests install PHPUnit's handler.
set_error_handler(
	static function ( $severity, $message, $file ) {
		return E_DEPRECATED === $severity
			&& 0 === strpos( $message, 'Method PDO::sqliteCreateFunction() is deprecated' )
			&& false !== strpos( $file, '/wp-sqlite-integration/wp-includes/sqlite/' );
	},
	E_DEPRECATED
);
try {
	\Automattic\Jetpack\Test_Environment::init( 'knowledge', 'sqlite' );
} finally {
	restore_error_handler();
}
require_once ABSPATH . 'wp-admin/includes/schema.php';
populate_roles();
require_once __DIR__ . '/KnowledgeTestCase.php';
