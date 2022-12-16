<?php
/**
 * Admin notice base class. Override this to implement each admin notice Jetpack Boost may show.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Admin;

use Automattic\Jetpack_Boost\Lib\Transient;

/**
 * Class Admin_Notice
 */
class Regenerate_Admin_Notice {

	private static $dismissal_key = 'dismiss-critical-css-notice';

	public static function enable() {
		Transient::set( 'regenerate_admin_notice', true );
	}

	public static function dismiss() {
		Transient::delete( 'regenerate_admin_notice', false );
	}

	public static function is_enabled() {
		return Transient::get( 'regenerate_admin_notice', false );
	}

	/**
	 * Helper method to generate a dismissal link for this message.
	 */
	private static function get_dismiss_url() {
		return add_query_arg(
			array(
				self::$dismissal_key => '',
			)
		);
	}

	public static function maybe_handle_dismissal() {
		// We're okay dismissing the notice without nonce verification.
		// phpcs:disable WordPress.Security.NonceVerification.Recommended
		if ( ! is_admin() || ! current_user_can( 'manage_options' ) || ! isset( $_GET[ self::$dismissal_key ] ) ) {
			return;
		}
		static::dismiss();
		wp_safe_redirect( remove_query_arg( self::$dismissal_key ) );
	}

	public static function init() {
		add_action( 'admin_notices', array( static::class, 'maybe_render' ) );
		if ( static::is_enabled() ) {
			static::maybe_handle_dismissal();
		}
	}

	public static function maybe_render() {
		if ( static::is_enabled() && current_user_can( 'manage_options' ) ) {
			static::render();
		}
	}

	public static function render() {
		// We're not actually using the GET parameter here, it's only used to find out what page we're on.
		// phpcs:disable WordPress.Security.NonceVerification.Recommended
		$on_settings_page = is_admin() && isset( $_GET['page'] ) && Admin::MENU_SLUG === $_GET['page'];
		if ( $on_settings_page ) {
			return;
		}
		?>
		<div id="jetpack-boost-notice-critical-css-regenerate" class="notice notice-warning is-dismissible">
			<h3>
				<?php esc_html_e( 'Jetpack Boost - Action Required', 'jetpack-boost' ); ?>
			</h3>
			<p>
				<?php esc_html_e( 'The Critical CSS generated by Jetpack Boost was cleared due to a change in the site theme.', 'jetpack-boost' ); ?>
			</p>
			<p>
				<?php esc_html_e( 'You can go to the Jetpack Boost settings page to have it re-generated automatically.', 'jetpack-boost' ); ?>
			</p>

			<p>
				<a class='button button-primary' href="<?php echo esc_url( admin_url( 'admin.php?page=' . Admin::MENU_SLUG ) ); ?>">
					<strong>
						<?php esc_html_e( 'Go to Jetpack Boost', 'jetpack-boost' ); ?>
					</strong>
				</a>
				<a class="jb-dismiss-notice" href="<?php echo esc_url( static::get_dismiss_url() ); ?>">
					<strong>
						<?php esc_html_e( 'Dismiss notice', 'jetpack-boost' ); ?>
					</strong>
				</a>
			</p>
		</div>
		<?php
	}
}
