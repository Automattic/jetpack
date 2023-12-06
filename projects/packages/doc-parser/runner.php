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

$parser = new \Automattic\Jetpack\Doc_Parser();
$parser->generate( array( $argv[1], 'phpdoc.json' ) );
