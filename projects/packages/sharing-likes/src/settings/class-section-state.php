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
	 * @param bool $feature_running Whether the legacy feature can still produce output.
	 *                              Always true on WordPress.com Simple, which has no modules.
	 * @param bool $switched_off    Whether the feature's own settings leave it nothing to show,
	 *                              which is how Simple switches to the block.
	 * @return string One of the class constants.
	 */
	public static function for_section( bool $can_offer_block, bool $feature_running, bool $switched_off = false ): string {
		// Only with a block to move to: elsewhere the options are the one way back.
		if ( $can_offer_block ) {
			return $feature_running && ! $switched_off ? self::CONFIGURE_WITH_BLOCK_NUDGE : self::BLOCK_CALL_TO_ACTION;
		}

		return $feature_running ? self::CONFIGURE : self::OFF;
	}

	/**
	 * Whether a variant shows the feature's own options.
	 *
	 * @param string $state One of the class constants.
	 */
	public static function configures( string $state ): bool {
		return self::CONFIGURE === $state || self::CONFIGURE_WITH_BLOCK_NUDGE === $state;
	}

	/**
	 * Whether the shared "Show buttons on" section renders.
	 *
	 * It only governs legacy output, so it is hidden once neither feature produces any.
	 *
	 * @param string $sharing_state Variant the Sharing buttons section renders.
	 * @param string $likes_state   Variant the Like buttons section renders.
	 * @return bool
	 */
	public static function shows_placement( string $sharing_state, string $likes_state ): bool {
		return self::configures( $sharing_state ) || self::configures( $likes_state );
	}
}
