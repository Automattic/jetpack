<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Jetpack connection dashboard widget.
 *
 * @package automattic/jetpack
 */
class Jetpack_Connection_Widget {
	/**
	 * Indicates whether the class initialized or not.
	 *
	 * @var Jetpack_Connection_Widget
	 */
	private static $initialized = false;

	/**
	 * Intiialize the class by calling the setup static function.
	 *
	 * @return void
	 */
	public static function init() {
		if ( ! self::$initialized ) {
			self::$initialized = true;
			self::wp_dashboard_setup();
		}
	}

	/**
	 * Sets up the Jetpack Connection Widget in the WordPress admin dashboard.
	 */
	public static function wp_dashboard_setup() {
		$widget_title = sprintf(
			__( 'Jetpack Connection Widget', 'jetpack' )
		);

		wp_add_dashboard_widget(
			'jetpack_connection_widget',
			$widget_title,
			array( __CLASS__, 'connection_widget' )
		);
	}

	/**
	 * Load the widget
	 */
	public static function connection_widget() {
		?>
			<div class="jp-connection-banner">
				<p><?php esc_html_e( 'Placeholder connection widget', 'jetpack' ); ?></p>
			</div>
		<?php
	}
}
