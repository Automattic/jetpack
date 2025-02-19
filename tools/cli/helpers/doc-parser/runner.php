<?php
/**
 * A runner file that is used by Jetpack CLI to start the parsing process.
 *
 * @package automattic/jetpack-doc-parser
 */

/**
 * Loading the autoloader and starting the process.
 */
require __DIR__ . '/vendor/autoload.php';

( new \Automattic\Jetpack\Doc_Parser() )->generate( $argv[1], $argv[2], 'phpdoc.json' );
