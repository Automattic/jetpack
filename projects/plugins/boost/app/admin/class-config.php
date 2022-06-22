<?php

namespace Automattic\Jetpack_Boost\Admin;

use Automattic\Jetpack\Status;
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
	const SET_SHOW_RATING_PROMPT_NONCE = 'set_show_rating_prompt';
	const SET_SHOW_SCORE_PROMPT_NONCE  = 'set_show_score_prompt';

	/**
	 * Name of option to store status of show/hide rating and score prompts
	 */
	const SHOW_RATING_PROMPT_OPTION = 'jb_show_rating_prompt';
	const SHOW_SCORE_PROMPT_OPTION  = 'jb_show_score_prompt';

	public function init() {
		add_action( 'wp_ajax_set_show_rating_prompt', array( $this, 'handle_set_show_rating_prompt' ) );
		add_action( 'wp_ajax_set_show_score_prompt', array( $this, 'handle_set_show_score_prompt' ) );
	}

	public function constants() {
		$optimizations = ( new Optimizations() )->get_status();
		$internal_path = apply_filters( 'jetpack_boost_asset_internal_path', 'app/assets/dist/' );

		$constants = array(
			'version'             => JETPACK_BOOST_VERSION,
			'api'                 => array(
				'namespace' => JETPACK_BOOST_REST_NAMESPACE,
				'prefix'    => JETPACK_BOOST_REST_PREFIX,
			),
			'optimizations'       => $optimizations,
			'locale'              => get_locale(),
			'site'                => array(
				'domain'    => ( new Status() )->get_site_suffix(),
				'url'       => get_home_url(),
				'online'    => ! ( new Status() )->is_offline_mode(),
				'assetPath' => plugins_url( $internal_path, JETPACK_BOOST_PATH ),
			),
			'shownAdminNoticeIds' => $this->get_shown_admin_notice_ids(),
			'preferences'         => array(
				'showRatingPrompt' => $this->get_show_rating_prompt(),
				'showScorePrompt'  => $this->get_show_score_prompt(),
				'prioritySupport'  => Premium_Features::has_feature( Premium_Features::PRIORITY_SUPPORT ),
			),

			/**
			 * A bit of necessary magic,
			 * Explained more in the Nonce class.
			 *
			 * Nonces are automatically generated when registering routes.
			 */
			'nonces'              => Nonce::get_generated_nonces(),
		);

		// Give each module an opportunity to define extra constants.
		return apply_filters( 'jetpack_boost_js_constants', $constants );
	}

	/**
	 * Returns an array of notice ids (i.e.: jetpack-boost-notice-[slug]) for all
	 * visible admin notices.
	 *
	 * @return array List of notice ids.
	 */
	private function get_shown_admin_notice_ids() {
		$notices = Admin::get_admin_notices();
		$ids     = array();
		foreach ( $notices as $notice ) {
			$ids[] = $notice->get_id();
		}

		return $ids;
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
	public function handle_set_show_rating_prompt() {
		if ( check_ajax_referer( self::SET_SHOW_RATING_PROMPT_NONCE, 'nonce' ) && $this->check_for_permissions() ) {
			$response = array(
				'status' => 'ok',
			);

			$is_enabled = isset( $_POST['value'] ) && 'true' === $_POST['value'] ? '1' : '0';
			\update_option( self::SHOW_RATING_PROMPT_OPTION, $is_enabled );

			wp_send_json( $response );
		} else {
			$error = new \WP_Error( 'authorization', __( 'You do not have permission to take this action.', 'jetpack-boost' ) );
			wp_send_json_error( $error, 403 );
		}
	}

	/**
	 * Handle the ajax request to set show-rating-prompt status.
	 */
	public function handle_set_show_score_prompt() {
		if ( check_ajax_referer( self::SET_SHOW_SCORE_PROMPT_NONCE, 'nonce' ) && $this->check_for_permissions() ) {
			$response = array(
				'status' => 'ok',
			);

			$is_enabled = isset( $_POST['value'] ) && 'true' === $_POST['value'] ? '1' : '0';
			\update_option( self::SHOW_SCORE_PROMPT_OPTION, $is_enabled );

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
	 * Get the value of show_score_prompt.
	 *
	 * This determines if there should be a prompt after speed score worsens. Initially the value is set to true by
	 * default. Once the user clicks on the support button, it is switched to false.
	 *
	 * @return bool
	 */
	public function get_show_score_prompt() {
		return \get_option( self::SHOW_SCORE_PROMPT_OPTION, '1' ) === '1';
	}

	/**
	 * Clear the status of show_rating_prompt
	 */
	public static function clear_show_rating_prompt() {
		\delete_option( self::SHOW_RATING_PROMPT_OPTION );
	}

	/**
	 * Clear the status of show_score_prompt
	 */
	public static function clear_show_score_prompt() {
		\delete_option( self::SHOW_SCORE_PROMPT_OPTION );
	}
}
