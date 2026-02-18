<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Class with methods to extract metadata from a post/page about videos, images, links, mentions embedded
 * in or attached to the post/page.
 *
 * @deprecated $$next-version$$
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Post_Media\Meta_Extractor;

/**
 * Class with methods to extract metadata from a post/page about videos, images, links, mentions embedded
 * in or attached to the post/page.
 *
 * @deprecated $$next-version$$
 */
class Jetpack_Media_Meta_Extractor {

	// Some consts for what to extract.
	const ALL        = Meta_Extractor::ALL;
	const LINKS      = Meta_Extractor::LINKS;
	const MENTIONS   = Meta_Extractor::MENTIONS;
	const IMAGES     = Meta_Extractor::IMAGES;
	const SHORTCODES = Meta_Extractor::SHORTCODES;
	const EMBEDS     = Meta_Extractor::EMBEDS;
	const HASHTAGS   = Meta_Extractor::HASHTAGS;

	/**
	 * Gets the specified media and meta info from the given post.
	 * NOTE: If you have the post's HTML content already and don't need image data, use extract_from_content() instead.
	 *
	 * @deprecated $$next-version$$
	 *
	 * @param int     $blog_id The ID of the blog.
	 * @param int     $post_id The ID of the post.
	 * @param int     $what_to_extract A mask of things to extract, e.g. Jetpack_Media_Meta_Extractor::IMAGES | Jetpack_Media_Meta_Extractor::MENTIONS.
	 * @param boolean $extract_alt_text Should alt_text be extracted, defaults to false.
	 *
	 * @return array|WP_Error a structure containing metadata about the embedded things, or empty array if nothing found, or WP_Error on error.
	 */
	public static function extract( $blog_id, $post_id, $what_to_extract = self::ALL, $extract_alt_text = false ) {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\Jetpack\Post_Media\Meta_Extractor::extract' );
		return Meta_Extractor::extract( $blog_id, $post_id, $what_to_extract, $extract_alt_text );
	}

	/**
	 * Gets the specified meta info from the given post content.
	 * NOTE: If you want IMAGES, call extract( $blog_id, $post_id, ...) which will give you more/better image extraction
	 * This method will give you an error if you ask for IMAGES.
	 *
	 * @deprecated $$next-version$$
	 *
	 * @param string $content The HTML post_content of a post.
	 * @param int    $what_to_extract A mask of things to extract, e.g. Jetpack_Media_Meta_Extractor::IMAGES | Jetpack_Media_Meta_Extractor::MENTIONS.
	 * @param array  $already_extracted Previously extracted things, e.g. images from extract(), which can be used for x-referencing here.
	 *
	 * @return array a structure containing metadata about the embedded things, or empty array if nothing found, or WP_Error on error.
	 */
	public static function extract_from_content( $content, $what_to_extract = self::ALL, $already_extracted = array() ) {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\Jetpack\Post_Media\Meta_Extractor::extract_from_content' );
		return Meta_Extractor::extract_from_content( $content, $what_to_extract, $already_extracted );
	}

	/**
	 * Helper function to get images from HTML and return it with the set structure.
	 *
	 * @deprecated $$next-version$$
	 *
	 * @param string $content HTML content.
	 * @param array  $image_list Array of already found images.
	 * @param string $extract_alt_text Whether or not to extract the alt text.
	 *
	 * @return array|array[] Array of images.
	 */
	public static function extract_images_from_content( $content, $image_list, $extract_alt_text = false ) {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\Jetpack\Post_Media\Meta_Extractor::extract_images_from_content' );
		return Meta_Extractor::extract_images_from_content( $content, $image_list, $extract_alt_text );
	}

	/**
	 * Produces a set structure for extracted media items.
	 *
	 * @deprecated $$next-version$$
	 *
	 * @param array $image_list Array of images.
	 * @param array $image_booleans Image booleans.
	 *
	 * @return array|array[]
	 */
	public static function build_image_struct( $image_list, $image_booleans ) {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\Jetpack\Post_Media\Meta_Extractor::build_image_struct' );
		return Meta_Extractor::build_image_struct( $image_list, $image_booleans );
	}

	/**
	 * Extracts images from html.
	 *
	 * @deprecated $$next-version$$
	 *
	 * @param string  $html Some markup, possibly containing image tags.
	 * @param array   $images_already_extracted (just an array of image URLs without query strings, no special structure), used for de-duplication.
	 * @param boolean $extract_alt_text Should alt_text be extracted, defaults to false.
	 *
	 * @return array Image URLs extracted from the HTML, stripped of query params and de-duped
	 */
	public static function get_images_from_html( $html, $images_already_extracted, $extract_alt_text = false ) {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\Jetpack\Post_Media\Meta_Extractor::get_images_from_html' );
		return Meta_Extractor::get_images_from_html( $html, $images_already_extracted, $extract_alt_text );
	}

	/**
	 * Given an extracted image array reduce to src, alt_text, src_width, and src_height.
	 *
	 * @deprecated $$next-version$$
	 *
	 * @param array $images extracted image array.
	 *
	 * @return array reduced image array
	 */
	protected static function reduce_extracted_images( $images ) {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\Jetpack\Post_Media\Meta_Extractor::reduce_extracted_images' );
		return Meta_Extractor::reduce_extracted_images( $images );
	}
}
