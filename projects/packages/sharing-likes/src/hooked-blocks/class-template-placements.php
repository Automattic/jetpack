<?php
/**
 * Reads and saves where the Sharing Buttons and Like blocks are added to templates.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\Hooked_Blocks;

/**
 * Where each block is hooked into the single post and page templates: before the
 * post content or after it, never both. One autoloaded option per block, holding a list.
 *
 * @since $$next-version$$
 */
final class Template_Placements {

	/**
	 * The Sharing Buttons block.
	 */
	public const FEATURE_SHARING = 'sharing';

	/**
	 * The Like block.
	 */
	public const FEATURE_LIKES = 'likes';

	/**
	 * Before the post content, in single post and page templates.
	 */
	public const BEFORE_CONTENT = 'before_content';

	/**
	 * After the post content, in single post and page templates.
	 */
	public const AFTER_CONTENT = 'after_content';

	/**
	 * Every placement, in the order they are stored.
	 */
	public const PLACEMENTS = array( self::BEFORE_CONTENT, self::AFTER_CONTENT );

	/**
	 * Option holding each feature's placements.
	 */
	public const OPTIONS = array(
		self::FEATURE_SHARING => 'jetpack_sharing_buttons_auto_add',
		self::FEATURE_LIKES   => 'jetpack_likes_auto_add',
	);

	/**
	 * The placements a feature is set to, known values only.
	 *
	 * The Sharing option once held a boolean that meant "after the content", so a truthy scalar still does.
	 *
	 * @param string $feature One of the FEATURE_* constants.
	 * @return string[]
	 */
	public static function get( string $feature ): array {
		if ( ! isset( self::OPTIONS[ $feature ] ) ) {
			return array();
		}

		$stored = get_option( self::OPTIONS[ $feature ], array() );

		if ( ! is_array( $stored ) ) {
			return self::FEATURE_SHARING === $feature && $stored ? array( self::AFTER_CONTENT ) : array();
		}

		return self::sanitize( $stored );
	}

	/**
	 * Save a feature's placements. The one writer for both options.
	 *
	 * @param string $feature    One of the FEATURE_* constants.
	 * @param array  $placements Placements to save; unknown values, duplicates and a second side of the content are dropped.
	 * @return string[] The placements as saved.
	 */
	public static function update( string $feature, array $placements ): array {
		if ( ! isset( self::OPTIONS[ $feature ] ) ) {
			return array();
		}

		$placements = self::sanitize( $placements );
		update_option( self::OPTIONS[ $feature ], $placements, true );

		return $placements;
	}

	/**
	 * Known placements only, each once, in `PLACEMENTS` order, with at most one side of the content.
	 *
	 * Core inserts a block hooked on both sides of one anchor only before it, so after wins, as the legacy option meant.
	 *
	 * @param array $placements Placements, possibly from untrusted input.
	 * @return string[]
	 */
	private static function sanitize( array $placements ): array {
		$after = in_array( self::AFTER_CONTENT, $placements, true );

		return array_values(
			array_filter(
				self::PLACEMENTS,
				static function ( string $placement ) use ( $placements, $after ): bool {
					return in_array( $placement, $placements, true ) && ! ( $after && self::BEFORE_CONTENT === $placement );
				}
			)
		);
	}
}
