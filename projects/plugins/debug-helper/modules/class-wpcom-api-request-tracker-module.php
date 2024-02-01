<?php // phpcs:disable WordPress.PHP.DevelopmentFunctions.error_log_print_r
/**
 * Plugin Name: WPCOM API Request Tracker
 * Description: Displays the number of requests to WPCOM API endpoints for the current page request.
 * Author: Bestpack
 * Version: 1.0
 * Text Domain: jetpack
 *
 * @package automattic/jetpack-debug-helper
 */

/**
 * Require the core WPCOM API request tracker functionality.
 */
require __DIR__ . '/inc/class-wpcom-api-request-tracker.php';
WPCOM_API_Request_Tracker::init();

/**
 * Class WPCOM_API_Request_Tracker_Module
 */
class WPCOM_API_Request_Tracker_Module {
	/**
	 * WPCOM API request count.
	 *
	 * @var int
	 */
	public $request_count = 0;

	/**
	 * WPCOM_Request_Tracker constructor.
	 */
	public function __construct() {
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
		add_action( 'wp_before_admin_bar_render', array( $this, 'register_admin_bar_menu' ), 1000000 );
		add_action( 'admin_footer', array( $this, 'render' ), 1000 );
		add_action( 'wp_footer', array( $this, 'render' ), 1000 );
	}

	/**
	 * Enqueue scripts.
	 */
	public function enqueue_scripts() {
		wp_enqueue_style( 'broken_token_style', plugin_dir_url( __FILE__ ) . 'inc/css/wpcom-api-request-tracker.css', array(), JETPACK_DEBUG_HELPER_VERSION );
		wp_enqueue_script( 'broken_token_script', plugin_dir_url( __FILE__ ) . 'inc/js/wpcom-api-request-tracker.js', array( 'jquery' ), JETPACK_DEBUG_HELPER_VERSION, true );
	}

	/**
	 * Register the admin bar menu.
	 */
	public function register_admin_bar_menu() {
		global $wp_admin_bar;

		$wp_admin_bar->add_menu(
			array(
				'id'     => 'wpcom-api-request-tracker',
				'parent' => 'top-secondary',
				'title'  => 'WPCOM API Requests',
			)
		);
	}

	/**
	 * Render the details panel.
	 */
	public function render() {
		$requests = WPCOM_API_Request_Tracker::init()->get_requests();

		?>
		<script>var wpcom_api_request_tracker_count = <?php echo esc_js( array_sum( $requests ) ); ?>;</script>
		<div id='wpcom-api-request-tracker'>

			<div id="wpcom-api-request-tracker-actions">
				<span class="maximize">+</span>
				<span class="restore">&ndash;</span>
				<span class="close">&times;</span>
			</div>

			<div id='wpcom-api-request-tracker-info'>
				<p>Request Count: <?php echo esc_html( array_sum( $requests ) ); ?></p>
				<p>Request URLs:</p>
				<ul>
					<?php foreach ( $requests as $request => $count ) : ?>
						<li><?php echo esc_html( "$count - $request" ); ?></li>
					<?php endforeach; ?>
				</ul>
			</div>
		</div>
		<?php
	}
}

new WPCOM_API_Request_Tracker_Module();

// phpcs:enable
