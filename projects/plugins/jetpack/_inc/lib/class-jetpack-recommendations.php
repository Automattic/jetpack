<?php
/**
 * Utilities related to the Jetpack Recommendations
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Current_Plan as Jetpack_Plan;
use Automattic\Jetpack\Plugins_Installer;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;

/**
 * Contains utilities related to the Jetpack Recommendations.
 *
 * @package automattic/jetpack
 */

/**
 * Jetpack_Recommendations class
 */
class Jetpack_Recommendations {
	const PUBLICIZE_RECOMMENDATION   = 'publicize';
	const PROTECT_RECOMMENDATION     = 'protect';
	const ANTI_SPAM_RECOMMENDATION   = 'anti-spam';
	const VIDEOPRESS_RECOMMENDATION  = 'videopress';
	const BACKUP_PLAN_RECOMMENDATION = 'backup-plan';
	const BOOST_RECOMMENDATION       = 'boost';

	const CONDITIONAL_RECOMMENDATIONS_OPTION = 'recommendations_conditional';
	const CONDITIONAL_RECOMMENDATIONS        = array(
		self::PUBLICIZE_RECOMMENDATION,
		self::PROTECT_RECOMMENDATION,
		self::ANTI_SPAM_RECOMMENDATION,
		self::VIDEOPRESS_RECOMMENDATION,
		self::BACKUP_PLAN_RECOMMENDATION,
		self::BOOST_RECOMMENDATION,
	);

	const VIDEOPRESS_TIMED_ACTION = 'jetpack_recommend_videopress';

	/**
	 * Returns a boolean indicating if the Jetpack Recommendations are enabled.
	 *
	 * @since 9.3.0
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		// Shortcircuit early if Jetpack is not active or we are in offline mode.
		if ( ! Jetpack::is_connection_ready() || ( new Status() )->is_offline_mode() ) {
			return false;
		}

		// No recommendations for Atomic sites, they already get onboarded in Calypso.
		if ( ( new Host() )->is_woa_site() ) {
			return false;
		}

		self::initialize_jetpack_recommendations();

		return true;
	}

	/**
	 * Returns a boolean indicating if the Jetpack Banner is enabled.
	 *
	 * @since 9.3.0
	 *
	 * @deprecated 13.2
	 *
	 * @return bool
	 */
	public static function is_banner_enabled() {
		_deprecated_function( __METHOD__, 'jetpack-13.2' );
		return false;
	}

	/**
	 * Set up actions to monitor for things that trigger a recommendation.
	 *
	 * @return false|void
	 */
	public static function init_conditional_recommendation_actions() {
		// Check to make sure that recommendations are enabled.
		if ( ! self::is_enabled() ) {
			return false;
		}

		// Monitor for the publishing of a new post.
		add_action( 'transition_post_status', array( static::class, 'post_transition' ), 10, 3 );
		add_action( 'jetpack_activate_module', array( static::class, 'jetpack_module_activated' ), 10, 2 );

		// Monitor for activating a new plugin.
		add_action( 'activated_plugin', array( static::class, 'plugin_activated' ), 10 );

		// Monitor for the addition of a new comment.
		add_action( 'comment_post', array( static::class, 'comment_added' ), 10, 3 );

		// Monitor for Jetpack connection success.
		add_action( 'jetpack_authorize_ending_authorized', array( static::class, 'jetpack_connected' ) );
		add_action( self::VIDEOPRESS_TIMED_ACTION, array( static::class, 'recommend_videopress' ) );

		// Monitor for changes in plugins that have auto-updates enabled
		add_action( 'update_site_option_auto_update_plugins', array( static::class, 'plugin_auto_update_settings_changed' ), 10, 3 );
	}

	/**
	 * Check when Jetpack modules are activated if some recommendations should be skipped.
	 *
	 * @param string $module Name of the module activated.
	 * @param bool   $success Whether the module activation was successful.
	 */
	public static function jetpack_module_activated( $module, $success ) {
		if ( 'publicize' === $module && $success ) {
			self::disable_conditional_recommendation( self::PUBLICIZE_RECOMMENDATION );
		} elseif ( 'videopress' === $module && $success ) {
			// If VideoPress is enabled and a recommendation for it is scheduled, cancel that recommendation.
			$recommendation_timestamp = wp_next_scheduled( self::VIDEOPRESS_TIMED_ACTION );
			if ( false !== $recommendation_timestamp ) {
				wp_unschedule_event( $recommendation_timestamp, self::VIDEOPRESS_TIMED_ACTION );
			}
		}
	}

	/**
	 * Hook for transition_post_status that checks for the publishing of a new post or page.
	 * Used to enable the publicize and boost recommendations.
	 *
	 * @param string  $new_status new status of post.
	 * @param string  $old_status old status of post.
	 * @param WP_Post $post the post object being updated.
	 */
	public static function post_transition( $new_status, $old_status, $post ) {
		// Check for condition when post has been published.
		if ( 'post' === $post->post_type && 'publish' === $new_status && 'publish' !== $old_status && ! Jetpack::is_module_active( 'publicize' ) ) {
			// Set the publicize recommendation to have met criteria to be shown.
			self::enable_conditional_recommendation( self::PUBLICIZE_RECOMMENDATION );
			return;
		}
		// A new page has been published
		// Check to see if the boost plugin is active
		if (
			'page' === $post->post_type &&
			'publish' === $new_status &&
			'publish' !== $old_status &&
			! Plugins_Installer::is_plugin_active( 'boost/jetpack-boost.php' ) &&
			! Plugins_Installer::is_plugin_active( 'jetpack-boost/jetpack-boost.php' )
		) {
			self::enable_conditional_recommendation( self::BOOST_RECOMMENDATION );
		}
	}

	/**
	 * Runs when a plugin gets activated
	 *
	 * @param string $plugin Path to the plugins file relative to the plugins directory.
	 */
	public static function plugin_activated( $plugin ) {
		// If the plugin is in this list, don't enable the recommendation.
		$plugin_whitelist = array(
			'jetpack.php',
			'akismet.php',
			'creative-mail.php',
			'jetpack-backup.php',
			'jetpack-boost.php',
			'jetpack-protect.php',
			'crowdsignal.php',
			'vaultpress.php',
			'woocommerce.php',
		);

		$path_parts  = explode( '/', $plugin );
		$plugin_file = $path_parts ? array_pop( $path_parts ) : $plugin;

		if ( ! in_array( $plugin_file, $plugin_whitelist, true ) ) {
			$products = array_column( Jetpack_Plan::get_products(), 'product_slug' );

			// Check for a plan or product that enables scan.
			$plan_supports_scan = Jetpack_Plan::supports( 'scan' );
			$has_scan_product   = count( array_intersect( array( 'jetpack_scan', 'jetpack_scan_monthly' ), $products ) ) > 0;
			$has_scan           = $plan_supports_scan || $has_scan_product;

			// Check if Jetpack Protect plugin is already active.
			$has_protect = Plugins_Installer::is_plugin_active( 'jetpack-protect/jetpack-protect.php' ) || Plugins_Installer::is_plugin_active( 'protect/jetpack-protect.php' );

			if ( ! $has_scan && ! $has_protect ) {
				self::enable_conditional_recommendation( self::PROTECT_RECOMMENDATION );
			}
		}
	}

	/**
	 * Runs when the auto_update_plugins option has been changed
	 *
	 * @param string $option_name - the name of the option updated ( always auto_update_plugins ).
	 * @param array  $new_auto_update_plugins - plugins that have auto update enabled following the change.
	 * @param array  $old_auto_update_plugins - plugins that had auto update enabled before the most recent change.
	 * @return void
	 */
	public static function plugin_auto_update_settings_changed( $option_name, $new_auto_update_plugins, $old_auto_update_plugins ) {
		if (
			is_multisite() ||
			self::is_conditional_recommendation_enabled( self::BACKUP_PLAN_RECOMMENDATION )
		) {
			return;
		}

		// Look for plugins that have had auto-update enabled in this most recent update.
		$enabled_auto_updates = array_diff( $new_auto_update_plugins, $old_auto_update_plugins );
		if ( ! empty( $enabled_auto_updates ) ) {
			// Check the backup state.
			$rewind_state = get_transient( 'jetpack_rewind_state' );
			$has_backup   = $rewind_state && in_array( $rewind_state->state, array( 'awaiting_credentials', 'provisioning', 'active' ), true );

			if ( ! $has_backup ) {
				self::enable_conditional_recommendation( self::BACKUP_PLAN_RECOMMENDATION );
			}
		}
	}

	/**
	 * Runs when a new comment is added.
	 *
	 * @param integer $comment_id The ID of the comment that was added.
	 * @param bool    $comment_approved Whether or not the comment is approved.
	 * @param array   $commentdata Comment data.
	 */
	public static function comment_added( $comment_id, $comment_approved, $commentdata ) {
		if ( self::is_conditional_recommendation_enabled( self::ANTI_SPAM_RECOMMENDATION ) ) {
			return;
		}

		if ( Plugins_Installer::is_plugin_active( 'akismet/akismet.php' ) ) {
			return;
		}

		// The site has anti-spam features already.
		$site_products         = array_column( Jetpack_Plan::get_products(), 'product_slug' );
		$has_anti_spam_product = count( array_intersect( array( 'jetpack_anti_spam', 'jetpack_anti_spam_monthly' ), $site_products ) ) > 0;

		if ( Jetpack_Plan::supports( 'akismet' ) || Jetpack_Plan::supports( 'antispam' ) || $has_anti_spam_product ) {
			return;
		}

		if ( isset( $commentdata['comment_post_ID'] ) ) {
			$post_id = $commentdata['comment_post_ID'];
		} else {
			$comment = get_comment( $comment_id );
			$post_id = $comment->comment_post_ID;
		}
		$comment_count = get_comments_number( $post_id );

		if ( intval( $comment_count ) >= 5 ) {
			self::enable_conditional_recommendation( self::ANTI_SPAM_RECOMMENDATION );
		}
	}

	/**
	 * Runs after a successful connection is made.
	 */
	public static function jetpack_connected() {
		// Schedule a recommendation for VideoPress in 2 weeks.
		if ( false === wp_next_scheduled( self::VIDEOPRESS_TIMED_ACTION ) ) {
			$date = new DateTime();
			$date->add( new DateInterval( 'P14D' ) );
			wp_schedule_single_event( $date->getTimestamp(), self::VIDEOPRESS_TIMED_ACTION );
		}
	}

	/**
	 * Enable a recommendation for VideoPress.
	 */
	public static function recommend_videopress() {
		// Check to see if the VideoPress recommendation is already enabled.
		if ( self::is_conditional_recommendation_enabled( self::VIDEOPRESS_RECOMMENDATION ) ) {
			return;
		}

		$site_plan     = Jetpack_Plan::get();
		$site_products = array_column( Jetpack_Plan::get_products(), 'product_slug' );

		if ( self::should_recommend_videopress( $site_plan, $site_products ) ) {
			self::enable_conditional_recommendation( self::VIDEOPRESS_RECOMMENDATION );
		}
	}

	/**
	 * Should we provide a recommendation for videopress?
	 * This method exists to facilitate unit testing
	 *
	 * @param array $site_plan A representation of the site's plan.
	 * @param array $site_products An array of product slugs.
	 * @return boolean
	 */
	public static function should_recommend_videopress( $site_plan, $site_products ) {
		// Does the site have the VideoPress module enabled?
		if ( Jetpack::is_module_active( 'videopress' ) ) {
			return false;
		}

		// Does the site plan have upgraded videopress features?
		// For now, this just checks to see if the site has a free plan.
		// Jetpack_Plan::supports('videopress') returns true for all plans, since there is a free tier.
		$is_free_plan = 'free' === $site_plan['class'];
		if ( ! $is_free_plan ) {
			return false;
		}

		// Does this site already have a VideoPress product?
		$has_videopress_product = count( array_intersect( array( 'jetpack_videopress', 'jetpack_videopress_monthly' ), $site_products ) ) > 0;
		if ( $has_videopress_product ) {
			return false;
		}

		return true;
	}

	/**
	 * Enable a recommendation.
	 *
	 * @param string $recommendation_name The name of the recommendation to enable.
	 * @return false|void
	 */
	public static function enable_conditional_recommendation( $recommendation_name ) {
		if ( ! in_array( $recommendation_name, self::CONDITIONAL_RECOMMENDATIONS, true ) ) {
			return false;
		}

		$conditional_recommendations = Jetpack_Options::get_option( self::CONDITIONAL_RECOMMENDATIONS_OPTION, array() );
		if ( ! in_array( $recommendation_name, $conditional_recommendations, true ) ) {
			$conditional_recommendations[] = $recommendation_name;
			Jetpack_Options::update_option( self::CONDITIONAL_RECOMMENDATIONS_OPTION, $conditional_recommendations );
		}
	}

	/**
	 * Disable a recommendation.
	 *
	 * @param string $recommendation_name The name of the recommendation to disable.
	 * @return false|void
	 */
	public static function disable_conditional_recommendation( $recommendation_name ) {
		if ( ! in_array( $recommendation_name, self::CONDITIONAL_RECOMMENDATIONS, true ) ) {
			return false;
		}

		$conditional_recommendations = Jetpack_Options::get_option( self::CONDITIONAL_RECOMMENDATIONS_OPTION, array() );
		$recommendation_index        = array_search( $recommendation_name, $conditional_recommendations, true );

		if ( false !== $recommendation_index ) {
			array_splice( $conditional_recommendations, $recommendation_index, 1 );
			Jetpack_Options::update_option( self::CONDITIONAL_RECOMMENDATIONS_OPTION, $conditional_recommendations );
		}
	}

	/**
	 * Check to see if a recommendation is enabled or not.
	 *
	 * @param string $recommendation_name The name of the recommendation to check for.
	 * @return bool
	 */
	public static function is_conditional_recommendation_enabled( $recommendation_name ) {
		$conditional_recommendations = Jetpack_Options::get_option( self::CONDITIONAL_RECOMMENDATIONS_OPTION, array() );
		return in_array( $recommendation_name, $conditional_recommendations, true );
	}

	/**
	 * Gets data for all conditional recommendations.
	 *
	 * @return mixed
	 */
	public static function get_conditional_recommendations() {
		return Jetpack_Options::get_option( self::CONDITIONAL_RECOMMENDATIONS_OPTION, array() );
	}

	/**
	 * Get an array of new conditional recommendations that have not been viewed.
	 *
	 * @return array
	 */
	public static function get_new_conditional_recommendations() {
		$conditional_recommendations = self::get_conditional_recommendations();
		$recommendations_data        = Jetpack_Options::get_option( 'recommendations_data', array() );
		$viewed_recommendations      = isset( $recommendations_data['viewedRecommendations'] ) ? $recommendations_data['viewedRecommendations'] : array();

		// array_diff returns a keyed array - reduce to unique values.
		return array_unique( array_values( array_diff( $conditional_recommendations, $viewed_recommendations ) ) );
	}

	/**
	 * Initializes the Recommendations step according to the Setup Wizard state.
	 */
	private static function initialize_jetpack_recommendations() {
		if ( Jetpack_Options::get_option( 'recommendations_step' ) ) {
			return;
		}

		$setup_wizard_status = Jetpack_Options::get_option( 'setup_wizard_status' );
		if ( 'completed' === $setup_wizard_status ) {
			Jetpack_Options::update_option( 'recommendations_step', 'setup-wizard-completed' );
		}
	}

	/**
	 * Get the data for the recommendations
	 *
	 * @return array Recommendations data
	 */
	public static function get_recommendations_data() {
		self::initialize_jetpack_recommendations();

		return Jetpack_Options::get_option( 'recommendations_data', array() );
	}

	/**
	 * Update the data for the recommendations
	 *
	 * @param WP_REST_Request $data The data.
	 */
	public static function update_recommendations_data( $data ) {
		if ( ! empty( $data ) ) {
			Jetpack_Options::update_option( 'recommendations_data', $data );
		}
	}

	/**
	 * Get the data for the recommendations
	 *
	 * @return array Recommendations data
	 */
	public static function get_recommendations_step() {
		self::initialize_jetpack_recommendations();

		return array(
			'step' => Jetpack_Options::get_option( 'recommendations_step', 'not-started' ),
		);
	}

	/**
	 * Update the step for the recommendations
	 *
	 * @param WP_REST_Request $step The step.
	 */
	public static function update_recommendations_step( $step ) {
		if ( ! empty( $step ) ) {
			Jetpack_Options::update_option( 'recommendations_step', $step );
		}
	}
}
