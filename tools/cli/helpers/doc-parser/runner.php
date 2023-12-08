<?php
/**
 * A runner file that is used by Jetpack CLI to start the parsing process.
 *
 * @package automattic/jetpack-doc-parser
 */

use Michelf\Markdown;

/**
 * Loading the autoloader and starting the process.
 */
require __DIR__ . '/vendor/autoload.php';

$args   = array_slice( $argv, 1 );
$parser = new \Automattic\Jetpack\Doc_Parser();
$parser->generate( array( $args, 'phpdoc.json' ) );

$markdown  = new Markdown();
$docs_json = json_decode( file_get_contents( __DIR__ . '/docs.json' ), true );

$result = array();
// Each parent file has to be present in the import.
foreach ( $docs_json['parents'] as $parent => $child_docs ) {

	// We're assuming files are in the Monorepo root.
	$contents = $markdown->defaultTransform(
		file_get_contents(
			dirname( __DIR__, 4 ) . DIRECTORY_SEPARATOR . $parent
		)
	);

	$document = new DOMDocument();
	$document->loadHTML( $contents );

	$doc_title = $parent;

	$headers = $document->getElementsByTagName( 'h1' );
	if ( count( $headers ) ) {
		$doc_title = $headers[0]->textContent;
	}

	$result[] = array(
		'title'   => $doc_title,
		'content' => $document->saveHTML(),
	);
}

file_put_contents( './markdown.json', json_encode( $result ) );
