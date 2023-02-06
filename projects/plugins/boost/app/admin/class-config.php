<?php

namespace Automattic\Jetpack_Boost\Admin;

use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;
use Automattic\Jetpack_Boost\Features\Optimizations\Optimizations;
use Automattic\Jetpack_Boost\Lib\Premium_Features;
use Automattic\Jetpack_Boost\REST_API\Permissions\Nonce;

/**
 * Handle the configuration constants.
 *
 * This is a global state of Jetpack Boost and passed on to the front-end.
 */
class Config {
	/**
	 * Nonce action for setting the statuses of rating and score prompts.
	 */
	const SET_SHOW_SCORE_PROMPT_NONCE = 'set_show_score_prompt';

	/**
	 * Name of option to store status of show/hide rating and score prompts
	 */
	const DISMISSED_MODALS_OPTION = 'jb_show_score_prompt';

	public function init() {
		add_action( 'wp_ajax_set_show_score_prompt', array( $this, 'handle_set_show_score_prompt' ) );
		add_action( 'jetpack_boost_before_module_status_update', array( $this, 'on_module_status_change' ), 10, 2 );
	}

	public function constants() {
		$optimizations = ( new Optimizations() )->get_status();
		$internal_path = apply_filters( 'jetpack_boost_asset_internal_path', 'app/assets/dist/' );

		$constants = array(
			'version'               => JETPACK_BOOST_VERSION,
			'api'                   => array(
				'namespace' => JETPACK_BOOST_REST_NAMESPACE,
				'prefix'    => JETPACK_BOOST_REST_PREFIX,
			),
			'optimizations'         => $optimizations,
			'locale'                => get_locale(),
			'site'                  => array(
				'domain'     => ( new Status() )->get_site_suffix(),
				'url'        => get_home_url(),
				'online'     => ! ( new Status() )->is_offline_mode(),
				'assetPath'  => plugins_url( $internal_path, JETPACK_BOOST_PATH ),
				'getStarted' => self::is_getting_started(),
				'isAtomic'   => ( new Host() )->is_woa_site(),
			),
			'preferences'           => array(
				'prioritySupport' => Premium_Features::has_feature( Premium_Features::PRIORITY_SUPPORT ),
			),
			'showScorePromptNonce'  => wp_create_nonce( self::SET_SHOW_SCORE_PROMPT_NONCE ),
			'dismissedScorePrompts' => $this->get_dismissed_modals(),

			/**
			 * A bit of necessary magic,
			 * Explained more in the Nonce class.
			 *
			 * Nonces are automatically generated when registering routes.
			 */
			'nonces'                => Nonce::get_generated_nonces(),
		);

		// Give each module an opportunity to define extra constants.
		return apply_filters( 'jetpack_boost_js_constants', $constants );
	}

	/**
	 * Get the value of show_rating_prompt.
	 *
	 * This determines if there should be a prompt after speed score improvements. Initially the value is set to true by
	 * default. Once the user clicks on the rating button, it is switched to false.
	 *
	 * @return bool
	 */
	public function get_show_rating_prompt() {
		return \get_option( self::SHOW_RATING_PROMPT_OPTION, '1' ) === '1';
	}

	/**
	 * Handle the ajax request to set show-rating-prompt status.
	 */
	public function handle_set_show_score_prompt() {
		if ( check_ajax_referer( self::SET_SHOW_SCORE_PROMPT_NONCE, 'nonce' ) && $this->check_for_permissions() ) {
			$response = array(
				'status' => 'ok',
			);

			// sanitize the id of the variable and then check it is one of the modals we
			// allow.
			if ( isset( $_POST['id'] ) ) {
				$modal_to_banish = sanitize_text_field( wp_unslash( $_POST['id'] ) );
				$allowed_modals  = array(
					'score-increase',
					'score-decrease',
					'super-cache-not-enabled',
				);
				if ( ! in_array( $modal_to_banish, $allowed_modals, true ) ) {
					$error = new \WP_Error( 'authorization', __( 'This modal is not dismissable.', 'jetpack-boost' ) );
					wp_send_json_error( $error, 403 );
				}

				// get the current dismissed modals
				$dismissed_modals = $this->get_dismissed_modals();
				array_push( $dismissed_modals, $modal_to_banish );
				$dismissed_modals = array_unique( $dismissed_modals );

				\update_option( self::DISMISSED_MODALS_OPTION, $dismissed_modals, false );
			}

			wp_send_json( $response );
		} else {
			$error = new \WP_Error( 'authorization', __( 'You do not have permission to take this action.', 'jetpack-boost' ) );
			wp_send_json_error( $error, 403 );
		}
	}

	/**
	 * Check for permissions.
	 *
	 * @return bool
	 */
	public function check_for_permissions() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Get the which modals have been displayed.
	 *
	 * This now holds an array of modal IDs since we are keeping the option name the same
	 * earlier versions of Boost would set this to false.
	 *
	 * @return string[]
	 */
	public function get_dismissed_modals() {
		// get the option. This will be false, or an empty array
		$dismissed_modals = \get_option( self::DISMISSED_MODALS_OPTION, array() );
		// if the value is false - "rate boost" was dismissed so the score-increase modal should not show.
		if ( $dismissed_modals === false ) {
			$dismissed_modals = array( 'score-increase' );
			// if an empty array then no score prompts have been dismissed yet.
		} elseif ( $dismissed_modals === array( '' ) ) {
			$dismissed_modals = array();
		}
		return $dismissed_modals;
	}

	/**
	 * Clear the status of show_score_prompt
	 */
	public static function clear_show_score_prompt() {
		\delete_option( self::DISMISSED_MODALS_OPTION );
	}

	/**
	 * Flag get started as complete if a module is enabled.
	 *
	 * @param string $module Module Slug.
	 * @param bool   $enabled Enabled status.
	 */
	public function on_module_status_change( $module, $status ) {
		if ( $status ) {
			self::set_getting_started( false );
		}
	}

	/**
	 * Enable of disable getting started page.
	 *
	 * If enabled, trying to open boost dashboard will take a user to the getting started page.
	 */
	public static function set_getting_started( $value ) {
		return \update_option( 'jb_get_started', $value, false );
	}

	/**
	 * Check if force redirect to getting started page is enabled.
	 */
	public static function is_getting_started() {
		// Aside from the boolean flag in the database, we also assume site already got started if they have premium features.
		return \get_option( 'jb_get_started', false ) && ! Premium_Features::has_feature( Premium_Features::CLOUD_CSS ) && ! ( new Status() )->is_offline_mode();
	}

	/**
	 * Clear the getting started option.
	 */
	public static function clear_getting_started() {
		\delete_option( 'jb_get_started' );
	}
}
