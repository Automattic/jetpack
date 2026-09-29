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
	 * This is a migration, not the section's off switch: it is what the Jetpack
	 * dashboard's "Switch to the … block" button does, and it leaves the block
	 * itself untouched. Simple has no modules, so it switches the feature off
	 * through the settings sharedaddy and Likes read there instead.
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
	 * the site will bring the feature back. Sites that can use the block are not
	 * offered it, matching the Jetpack dashboard.
	 *
	 * @param string $feature One of the `Placement_Section::FEATURE_*` constants.
	 * @return bool Whether the module is now active.
	 */
	public static function activate( string $feature ): bool {
		return (bool) ( new Modules() )->activate( self::MODULES[ $feature ], false, false );
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
