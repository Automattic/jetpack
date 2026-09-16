<?php
/**
 * Resolves which variant a Settings > Sharing section should render.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\Settings;

/**
 * Which variant a Settings > Sharing section renders, and whether the shared
 * placement section renders at all.
 *
 * Kept free of WordPress calls so every combination can be asserted directly.
 * Callers read the environment and pass the result in.
 */
final class Section_State {

	/**
	 * The feature's own configuration options.
	 */
	public const CONFIGURE = 'configure';

	/**
	 * Configuration options, plus a recommendation to use the block instead.
	 *
	 * The legacy output is still on the site, so the options stay usable.
	 */
	public const CONFIGURE_WITH_BLOCK_NUDGE = 'configure_with_block_nudge';

	/**
	 * No options: an invitation to add the block, and a link to the Site Editor.
	 */
	public const BLOCK_CALL_TO_ACTION = 'block_call_to_action';

	/**
	 * No options: a note that the feature is off.
	 */
	public const OFF = 'off';

	/**
	 * Resolve the variant for one section.
	 *
	 * Both sections follow the same rule; only their contents differ.
	 *
	 * @param bool $can_offer_block Whether the block is a route this site can be sent down.
	 *                              A block theme is necessary but not sufficient, which is why
	 *                              callers resolve this rather than passing the theme type.
	 * @param bool $feature_enabled Whether the legacy feature can still produce output.
	 *                              Always true on WordPress.com Simple, which has no modules.
	 * @return string One of the class constants.
	 */
	public static function for_section( bool $can_offer_block, bool $feature_enabled ): string {
		if ( ! $feature_enabled ) {
			return $can_offer_block ? self::BLOCK_CALL_TO_ACTION : self::OFF;
		}

		return $can_offer_block ? self::CONFIGURE_WITH_BLOCK_NUDGE : self::CONFIGURE;
	}

	/**
	 * Whether the shared "Show buttons on" section renders.
	 *
	 * It only governs legacy output, so it is hidden once neither feature produces any.
	 *
	 * @param bool $sharing_enabled Whether sharing buttons can still produce output.
	 * @param bool $likes_enabled   Whether anything still reads the Likes settings, which
	 *                              includes Comment Likes without the Likes module.
	 * @return bool
	 */
	public static function shows_placement( bool $sharing_enabled, bool $likes_enabled ): bool {
		return $sharing_enabled || $likes_enabled;
	}
}
