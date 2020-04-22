<?php
/**
 * Jetpack's JITM Engine class.
 *
 * @package automattic/jetpack-jitm
 */

namespace Automattic\Jetpack\JITMS;

use Automattic\Jetpack\JITMS\Message;

/**
 * Class JITM\Engine
 *
 * Determines the rules of a JITM, which should display and when.
 */
class Engine {

	/**
	 * Is mobile browser
	 *
	 * @var bool $mobile_browser.
	 */
	private $mobile_browser;

	/**
	 * Returns the default rules
	 *
	 * @return array Default rules.
	 */
	public function default_rules() {
		$rules = array_merge(
			$this->preconnection_default_rules()
		);

		return apply_filters( 'jetpack_jitm_rules', $rules );
	}

	/**
	 * Returns the pre-connection JITMs default rules
	 *
	 * @return array Pre-connection JITMs default rules.
	 */
	private function preconnection_default_rules() {

		return array(
			( new Message( 'jpsetup-posts', 'pre-connect' ) )
				->user_is( 'administrator' )
				->with_icon()
				->message_path( '/wp:edit-post:admin_notices/' )
				->show(
					__( 'Do you know which of these posts gets the most traffic?', 'jetpack' ),
					__( 'Setup Jetpack to get in-depth stats about your content and visitors.', 'jetpack' )
				)
				->priority( 100 )
				->with_cta(
					__( 'Setup Jetpack', 'jetpack' ),
					'',
					function() {
						return esc_url( \Jetpack::init()->build_connect_url( true, false, 'pre-connection-jitm-posts' ) );
					}
				)
				->open_cta_in_same_window()
				->is_dismissible( true )
				->priority( 1000 )
				->is_hosted_with_partner( 'bluehost' ),
			( new Message( 'jpsetup-upload', 'pre-connect' ) )
				->user_is( 'administrator' )
				->with_icon()
				->message_path( '/wp:upload:admin_notices/' )
				->show(
					__( 'Do you want lightning-fast images?', 'jetpack' ),
					__( 'Setup Jetpack, enable Site Accelerator, and start serving your images lightning fast, for free.', 'jetpack' )
				)
				->priority( 100 )
				->with_cta(
					__( 'Setup Jetpack', 'jetpack' ),
					'',
					function() {
						return esc_url( \Jetpack::init()->build_connect_url( true, false, 'pre-connection-jitm-upload' ) );
					}
				)
				->open_cta_in_same_window()
				->is_dismissible( true )
				->priority( 1000 )
				->is_hosted_with_partner( 'bluehost' ),
			( new Message( 'jpsetup-widgets', 'pre-connect' ) )
				->user_is( 'administrator' )
				->with_icon()
				->message_path( '/wp:widgets:admin_notices/' )
				->show(
					__( 'Looking for even more widgets?', 'jetpack' ),
					__( 'Setup Jetpack for great additional widgets like business hours and maps.', 'jetpack' )
				)
				->priority( 100 )
				->with_cta(
					__( 'Setup Jetpack', 'jetpack' ),
					'',
					function() {
						return esc_url( \Jetpack::init()->build_connect_url( true, false, 'pre-connection-jitm-widgets' ) );
					}
				)
				->open_cta_in_same_window()
				->is_dismissible( true )
				->priority( 1000 )
				->is_hosted_with_partner( 'bluehost' ),
		);
	}

	/**
	 * Gets the top messages
	 *
	 * @param string $message_path Message path.
	 * @param string $user_level User level.
	 * @param string $query Message query.
	 * @param bool   $mobile_browser Uses mobile browser.
	 *
	 * @return array Rendered messages.
	 */
	public function get_top_messages( $message_path, $user_level = '', $query = '', $mobile_browser = false ) {
		$rules = $this->default_rules();

		if ( is_string( $user_level ) ) {
			$user_level = explode( ',', $user_level );
		} else {
			$user_level = array();
		}

		$rules = array_reduce(
			$rules,
			function ( $return, $rule ) use ( $message_path, $user_level, $query, $mobile_browser ) {
				$score = $rule->score( $message_path, $user_level, $query, $mobile_browser );
				if ( $score > $return[0] ) {
					$return = array( $score, array( $rule->render() ), array( $rule ) );
				} elseif ( $score === $return[0] && $score > 0 ) {
					$return[1][] = $rule->render();
					$return[2][] = $rule;
				}

				return $return;
			},
			array( 0, array(), array() )
		);

		$rendered_rules = array();

		foreach ( $rules[2] as $rule ) {
			$rendered_rules[] = $rule->render();
		}

		// get the top message which hasn't been dismissed.
		return $rendered_rules;
	}

	/**
	 * Dismisses a JITM feature class so that it will no longer be shown
	 *
	 * @param string $id The id of the JITM that was dismissed.
	 * @param string $feature_class The feature class of the JITM that was dismissed.
	 *
	 * @return bool Always true
	 */
	public static function dismiss( $id, $feature_class ) {
		$hide_jitm = \Jetpack_Options::get_option( 'hide_jitm' );
		if ( ! is_array( $hide_jitm ) ) {
			$hide_jitm = array();
		}

		if ( empty( $hide_jitm[ $feature_class ] ) || ! is_array( $hide_jitm[ $feature_class ] ) ) {
			$hide_jitm[ $feature_class ] = array(
				'last_dismissal' => 0,
				'number'         => 0,
			);
		}

		$hide_jitm[ $feature_class ] = array(
			'last_dismissal' => time(),
			'number'         => intval( $hide_jitm[ $feature_class ]['number'] ) + 1,
		);

		\Jetpack_Options::update_option( 'hide_jitm', $hide_jitm );

		return true;
	}

}
