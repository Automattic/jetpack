<?php
/**
 * The "Switch to the … block" and "Turn on" actions on Settings > Sharing.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\Settings;

use Automattic\Jetpack\Modules;

/**
 * Actions that change which variant a feature section renders, rather than a setting.
 *
 * Callers check authorization, and whether the section offers the action.
 */
final class Feature_Actions {

	/**
	 * Module each feature's legacy output comes from.
	 */
	private const MODULES = array(
		Placement_Section::FEATURE_SHARING => 'sharedaddy',
		Placement_Section::FEATURE_LIKES   => 'likes',
	);

	/**
	 * Stop producing a feature's legacy buttons, so the block can take over.
	 *
	 * A migration, not the section's off switch: it leaves the block itself untouched.
	 * Simple has no modules, so it switches the feature off through settings instead.
	 *
	 * @param string $feature One of the `Placement_Section::FEATURE_*` constants.
	 */
	public static function switch_to_block( string $feature ): void {
		if ( ! Environment::is_simple_site() ) {
			( new Modules() )->deactivate( self::MODULES[ $feature ] );
			return;
		}

		if ( Placement_Section::FEATURE_SHARING === $feature ) {
			self::remove_all_sharing_services();
			return;
		}

		// The legacy widget renders for either button. Posts that opted in individually keep
		// their buttons, and Comment Likes has no block to move to, so it is left alone.
		Likes_Options::set_likes_enabled( false );
		Likes_Options::set_reblogs_enabled( false );
	}

	/**
	 * Turn a feature's module back on.
	 *
	 * Only for the OFF variant, where no block route exists and nothing else on
	 * the site will bring the feature back.
	 *
	 * @param string $feature One of the `Placement_Section::FEATURE_*` constants.
	 * @return bool Whether the module is now active.
	 */
	public static function activate( string $feature ): bool {
		$modules = new Modules();
		$modules->activate( self::MODULES[ $feature ], false, false );

		// A host can force the module off, and `activate()` still saves it as active.
		return $modules->is_active( self::MODULES[ $feature ] );
	}

	/**
	 * Leave sharedaddy no services to render.
	 */
	private static function remove_all_sharing_services(): void {
		// Preferred over writing the option, because wpcom hooks the state change it announces.
		if ( class_exists( 'Sharing_Service' ) ) {
			( new \Sharing_Service() )->set_blog_services( array(), array() );
			return;
		}

		update_option(
			'sharing-services',
			array(
				'visible' => array(),
				'hidden'  => array(),
			)
		);
	}
}
