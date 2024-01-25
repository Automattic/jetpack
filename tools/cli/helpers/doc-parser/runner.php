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

$processed_docs = array();
$result         = array();

// Each parent file has to be present in the import.
foreach ( $docs_json['parents'] as $parent => $child_docs ) {
	if ( ! in_array( $parent, $processed_docs, true ) ) {
		printf( 'Extracting Markdown from %1$s.' . PHP_EOL, $parent );
		$result[]         = get_html_from_markdown( $parent );
		$processed_docs[] = $parent;
	}

	foreach ( $child_docs as $doc ) {
		if ( in_array( $doc, $processed_docs, true ) ) {
			continue;
		}

		printf( 'Extracting Markdown from %1$s.' . PHP_EOL, $doc );
		$data             = get_html_from_markdown( $doc );
		$data['parent']   = $parent;
		$processed_docs[] = $doc;

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
	$document->loadHTML(
		'<!DOCTYPE html><meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>'
		. $contents
	);

	$doc_title = $file_path;
	$anchors   = $document->getElementsByTagName( 'a' );
	foreach ( $anchors as $anchor ) {
		$link = parse_url( $anchor->getAttribute( 'href' ) );
		if ( ! $link || isset( $link['host'] ) || ! isset( $link['path'] ) ) {
			continue;
		}

		// Replace any relative links with absolute links to the GitHub repo.
		if ( str_starts_with( $link['path'], '../' ) ||
			str_starts_with( $link['path'], '/projects/' ) ||
			( substr_count( $link['path'], '/' ) > 2 ) ) {
				$link['path'] = preg_replace( '~^(\./|../)~', '', $link['path'], 1 );
				$link['path'] = 'https://github.com/Automattic/jetpack/blob/trunk' .
					( ! str_starts_with( $link['path'], '/' ) ? '/' : '' ) .
					$link['path'];
		}

		$extension = pathinfo( $link['path'], PATHINFO_EXTENSION );
		if ( ( $extension !== 'md' || $extension === '' ) &&
			! str_starts_with( $link['path'], 'http' ) ) {
				$link['path'] = preg_replace( '~^(\./|/)~', '', $link['path'], 1 );
				$link['path'] = 'https://github.com/Automattic/jetpack/blob/trunk/' .
					( str_contains( $link['path'], 'examples/' ) ? 'docs/' : '' ) .
					$link['path'];
		}

		// If the Path starts with ./docs/ and contains 2 slashes, it's a relative link to another doc.
		if ( ( str_starts_with( $link['path'], './docs' ) ||
			str_starts_with( $link['path'], '/docs/' ) ||
			str_starts_with( $file_path, 'docs/' ) ) &&
			substr_count( $link['path'], '/' ) <= 2 ) {
				$link['path'] = str_replace( array( './docs/', '/docs/', './' ), '', $link['path'] );
				$link['path'] = 'docs-' . $link['path'];
		}

		if ( ! str_starts_with( $link['path'], 'http' ) ) {
			$link['path'] = str_replace( '.md', '-md', $link['path'] );
		}

		echo( $link['path'] . ( isset( $link['fragment'] ) ? '#' . $link['fragment'] : '' ) . PHP_EOL );
	}
	$headers = $document->getElementsByTagName( 'h1' );
	if ( count( $headers ) ) {
		$doc_title = $headers[0]->textContent;

		$headers[0]->remove();
	}

	return array(
		'path'    => $file_path,
		'title'   => $doc_title,
		'content' => $document->saveHTML(),
	);
}
