<?php
/**
 * Place to properly deprecate Jetpack features.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Plugin;

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Status\Host;

/**
 * Place to properly deprecate Jetpack features.
 */
class Deprecate {

	/**
	 * The singleton instance.
	 *
	 * @var Deprecate
	 */
	private static $instance;

	/**
	 * An array of notices to display.
	 *
	 * @var array
	 */
	private $notices = array();

	/**
	 * Initialize the class.
	 */
	private function __construct() {
		// Modify the notices array to include the notices you want to display.
		// For more information, see /docs/deprecating-features.md.
		$this->notices = array(
			'my-admin' => array(
				'title'       => __( "Retired feature: Jetpack's XYZ Feature", 'jetpack' ),
				'message'     => __( 'This feature is being retired and will be removed effective November, 2024. Please use the Classic Theme Helper plugin instead.', 'jetpack' ),
				'link'        => array(
					'label' => __( 'Learn more', 'jetpack' ),
					'url'   => 'jetpack-support-xyz',
				),
				'show'        => false, // 'show' is not required, but setting it to false will ensure that the notice will not be displayed.
				'hide_in_woa' => true, // 'hide_in_woa' is not required, but setting it to true will ensure that the notice will not be displayed in the WoA admin (none will display in Simple regardless).
			),
		);
		$this->set_notices();

		if ( $this->has_notices() ) {
			// We only want the notice to appear on the main WP Admin dashboard, which hooking into load-index.php will allow.
			add_action(
				'load-index.php',
				function () {
					add_action( 'admin_notices', array( $this, 'render_admin_notices' ) );
				}
			);
			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );
			add_filter( 'my_jetpack_red_bubble_notification_slugs', array( $this, 'add_my_jetpack_red_bubbles' ) );
		}
	}

	/**
	 * Create/get the singleton instance.
	 *
	 * @return static
	 */
	public static function instance() {
		if ( null === static::$instance ) {
			static::$instance = new static();
		}

		return static::$instance;
	}

	/**
	 * Enqueue the scripts.
	 *
	 * @return void
	 */
	public function enqueue_admin_scripts() {
		if ( ! $this->has_notices() ) {
			return;
		}

		if ( ! wp_script_is( 'jetpack-deprecate', 'registered' ) ) {
			wp_register_script(
				'jetpack-deprecate',
				Assets::get_file_url_for_environment( '_inc/build/deprecate.min.js', '_inc/deprecate.js' ),
				array(),
				JETPACK__VERSION,
				true
			);
		}

		wp_enqueue_script( 'jetpack-deprecate' );
		wp_add_inline_script(
			'jetpack-deprecate',
			'window.noticeInfo = ' . wp_json_encode( $this->notices ) . ';',
			'before'
		);
	}

	/**
	 * Ensure the notices variable is properly formatted and includes the required suffix and show value.
	 *
	 * @return void
	 */
	private function set_notices() {
		$notices            = array();
		$required_id_suffix = '-deprecate-feature';
		$host               = new Host();

		foreach ( $this->notices as $id => $notice ) {
			if ( $host->is_woa_site() && isset( $notice['hide_in_woa'] ) && true === $notice['hide_in_woa'] ) {
				continue;
			}

			if ( isset( $notice['show'] ) && false === $notice['show'] ) {
				continue;
			}

			if ( empty( $notice['title'] ) || empty( $notice['message'] ) || empty( $notice['link']['url'] ) ) {
				continue;
			}

			if ( empty( $notice['link']['label'] ) ) {
				$notice['link']['label'] = __( 'Learn more', 'jetpack' );
			}

			if ( strpos( $id, $required_id_suffix ) === false ) {
				$id .= $required_id_suffix;
			}

			$notices[ $id ] = $notice;
		}

		$this->notices = $notices;
	}

	/**
	 * Render deprecation notices for relevant features.
	 *
	 * @return void
	 */
	public function render_admin_notices() {

		foreach ( $this->notices as $id => $notice ) {
			if ( $this->show_feature_notice( $id ) ) {
				$support_url = Redirect::get_url( $notice['link']['url'] );

				$this->render_notice(
					$id,
					'<div class="jetpack-deprecation-notice-container">' .
						'<div class="jetpack-deprecation-notice-svg">' .
							'<svg class="jetpack-deprecation-notice-icon gridicon gridicons-info-outline needs-offset" height="20" width="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" color="#000000">' .
								'<g><path d="M13 9h-2V7h2v2zm0 2h-2v6h2v-6zm-1-7c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8m0-2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z"></path></g>' .
							'</svg>' .
						'</div>' .
						'<div class="jetpack-deprecation-notice-text">' .
							'<p class="jetpack-deprection-notice-title">' . esc_html( $notice['title'] ) . '</p>' .
							'<p>' . esc_html( $notice['message'] ) . '</p>' .
							'<a href="' . $support_url . '" target="_blank" class="jetpack-deprecation-notice-link"> ' . esc_html( $notice['link']['label'] ) . '</a>' .
							'<svg class="gridicons-external" height="14" width="14" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 20">' .
								'<g><path d="M19 13v6c0 1.105-.895 2-2 2H5c-1.105 0-2-.895-2-2V7c0-1.105.895-2 2-2h6v2H5v12h12v-6h2zM13 3v2h4.586l-7.793 7.793 1.414 1.414L19 6.414V11h2V3h-8z"></path></g>' .
								'</svg>' .
						'</div>' .
					'</div>'
				);
			}
		}
	}

	/**
	 * Add the deprecation notices to My Jetpack.
	 *
	 * @param array $slugs Already added bubbles.
	 *
	 * @return array
	 */
	public function add_my_jetpack_red_bubbles( $slugs ) {

		foreach ( $this->notices as $id => $notice ) {
			if ( $this->show_feature_notice( $id ) ) {
				$slugs[ $id ] = array(
					'data' => array(
						'text'  => $notice['message'],
						'title' => $notice['title'],
						'link'  => array(
							'label' => esc_html( $notice['link']['label'] ),
							'url'   => Redirect::get_url( $notice['link']['url'] ),
						),
						'id'    => $id,
					),
				);
			}
		}
		return $slugs;
	}

	/**
	 * Render the notice.
	 *
	 * @param string $id The notice ID.
	 * @param string $text The notice text.
	 *
	 * @return void
	 */
	private function render_notice( $id, $text ) {
		printf(
			'<div id="%1$s" class="notice notice-warning is-dismissible jetpack-deprecate-dismissible" style="border-left-color: #000000;">%2$s</div>',
			esc_html( $id ),
			$text // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Output already escaped in render_admin_notices
		);
	}

	/**
	 * Check if there are any notices to be displayed, so we wouldn't load unnecessary JS and run excessive hooks.
	 *
	 * @return bool
	 */
	private function has_notices() {
		foreach ( $this->notices as $id => $notice ) {
			if ( $this->show_feature_notice( $id ) ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Check if the feature notice should be shown, based on the existence of the cookie.
	 *
	 * @param string $id The notice ID.
	 *
	 * @return bool
	 */
	private function show_feature_notice( $id ) {
		return empty( $_COOKIE['jetpack_deprecate_dismissed'][ $id ] );
	}
}
