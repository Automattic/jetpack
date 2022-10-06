<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

use Automattic\Jetpack\Assets;

/**
 * Jetpack connection dashboard widget.
 *
 * @package automattic/jetpack
 */
class Jetpack_Connection_Widget {
	/**
	 * Static instance
	 *
	 * @var Jetpack_Connection_Widget
	 */
	private static $instance = null;

	/**
	 * Intiialize the class by calling the setup static function.
	 *
	 * @return Jetpack_Connection_Widget
	 */
	public static function init() {
		if ( self::$instance === null ) {
			self::$instance = new Jetpack_Connection_Widget();
		}

		return self::$instance;
	}

	/**
	 * Jetpack_Connection_Widget constructor.
	 */
	public function __construct() {
		add_action( 'current_screen', array( $this, 'maybe_initialize_hooks' ) );
	}

	/**
	 * Will initialize hooks to display the new connection widget.
	 */
	public function maybe_initialize_hooks() {
		add_action( 'admin_print_styles', array( $this, 'admin_banner_styles' ) );

		add_action( 'wp_dashboard_setup', array( $this, 'wp_dashboard_setup' ) );
	}

	/**
	 * Sets up the Jetpack Connection Widget in the WordPress admin dashboard.
	 */
	public function wp_dashboard_setup() {
		if ( Jetpack_Options::get_option( 'dismissed_connection_banner' ) &&
			! Jetpack::is_connection_ready() ) {
			$widget_title = sprintf(
				__( 'Jetpack - Security, Backup, Speed & Growth', 'jetpack' )
			);

			wp_add_dashboard_widget(
				'jetpack_connection_widget',
				$widget_title,
				array( __CLASS__, 'connection_widget' )
			);
		}
	}

	/**
	 * Included the needed styles
	 */
	public function admin_banner_styles() {
		wp_enqueue_style(
			'jetpack-connection-widget',
			Assets::get_file_url_for_environment(
				'css/jetpack-connection-widget.min.css',
				'css/jetpack-connection-widget.css'
			),
			array(),
			JETPACK__VERSION
		);
	}

	/**
	 * Builds the connection url for the widget.
	 *
	 * @return string
	 */
	public static function build_connect_url() {
		$url = Jetpack::init()->build_connect_url(
			true,
			false,
			'unconnected-site-widget'
		);

		return add_query_arg( 'auth_approved', 'true', $url );
	}

	/**
	 * Load the widget
	 */
	public static function connection_widget() {
		$connect_url = self::build_connect_url();
		?>
			<div class="jp-connection-widget">
				<img
					width="100%"
					src="<?php echo esc_url( plugins_url( 'images/dashboard-connection-widget-hero.png', JETPACK__PLUGIN_FILE ) ); ?>" />
				<h3><?php esc_html_e( 'Finish setting up your site', 'jetpack' ); ?></h3>
				<p>
					<?php esc_html_e( 'You’re missing out on great Jetpack features bundled by your host, sign up to set up.', 'jetpack' ); ?>
				</p>
				<a href="<?php echo esc_url( $connect_url ); ?>"><?php esc_html_e( 'Set up Jetpack for free', 'jetpack' ); ?></a>
			</div>
		<?php
	}
}
