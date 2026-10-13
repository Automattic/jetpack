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
\Automattic\Jetpack\Test_Environment::init( 'knowledge', 'sqlite' );
require_once ABSPATH . 'wp-admin/includes/schema.php';
populate_roles();
require_once __DIR__ . '/../../src/knowledge.php';
require_once __DIR__ . '/KnowledgeTestCase.php';
