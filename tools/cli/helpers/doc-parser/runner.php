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

$docs_json = json_decode( file_get_contents( __DIR__ . '/docs.json' ), true );

$result = array();
// Each parent file has to be present in the import.
foreach ( $docs_json['parents'] as $parent => $child_docs ) {
	printf( 'Extracting Markdown from %1$s.' . PHP_EOL, $parent );
	$result[] = get_html_from_markdown( $parent );

	foreach ( $child_docs as $doc ) {
		printf( 'Extracting Markdown from %1$s.' . PHP_EOL, $doc );
		$data           = get_html_from_markdown( $doc );
		$data['parent'] = $parent;

		$result[] = $data;
	}
}

file_put_contents( './markdown.json', json_encode( $result ) );
print( 'Data exported to markdown.json' . PHP_EOL );

/**
 * Retrieves Markdown content from a specified file in HTML format.
 *
 * @param string $file_path the string containing the path to the file relative to Monorepo root.
 * @return array [ content => the HTML content, title => document title ]
 * @throws Exception $e if the file cannot be read.
 */
function get_html_from_markdown( $file_path ) {

	// We're assuming files are in the Monorepo root.
	$parser   = new Markdown();
	$markdown = file_get_contents(
		dirname( __DIR__, 4 ) . DIRECTORY_SEPARATOR . $file_path
	);

	if ( false === $markdown ) {
		throw new Exception( 'Could not read Markdown from ' . $file_path );
	}

	$contents = $parser->defaultTransform( $markdown );

	$document = new DOMDocument();
	$document->loadHTML( $contents );

	$doc_title = $file_path;

	$headers = $document->getElementsByTagName( 'h1' );
	if ( count( $headers ) ) {
		$doc_title = $headers[0]->textContent;
	}

	return array(
		'path'    => $file_path,
		'title'   => $doc_title,
		'content' => $document->saveHTML(),
	);
}
