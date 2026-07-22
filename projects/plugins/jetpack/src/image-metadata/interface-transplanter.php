<?php
/**
 * Contract for format-aware, semantics-free provenance copiers.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Plugin\Image_Metadata;

/**
 * Copies provenance-bearing container chunks/segments verbatim between two files
 * of the same image format, without parsing or understanding their contents.
 */
interface Transplanter {

	/**
	 * Check whether this transplanter handles a given MIME type.
	 *
	 * @param string $mime A MIME type such as `image/png`.
	 * @return bool True when this transplanter handles that format.
	 */
	public function supports( $mime );

	/**
	 * Read the provenance segments from a source file.
	 *
	 * @param string $source_path Absolute path to the source image.
	 * @return Payload|null Payload (possibly empty) on a readable file of this
	 *                      format, or null when the file cannot be read/parsed.
	 */
	public function extract( $source_path );

	/**
	 * Check whether a derivative already carries provenance segments.
	 *
	 * @param string $target_path Absolute path to a candidate derivative.
	 * @return bool True when the derivative already carries provenance segments.
	 */
	public function has_payload( $target_path );

	/**
	 * Inject the payload into the target file, atomically, only if it validates.
	 *
	 * @param string  $target_path Absolute path to the derivative to rewrite.
	 * @param Payload $payload     Segments to transplant.
	 * @return bool True when the file was rewritten; false when skipped or on failure.
	 */
	public function inject( $target_path, Payload $payload );
}
