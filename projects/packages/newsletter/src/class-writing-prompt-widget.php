<?php
/**
 * A class that adds the Daily Writing Prompt dashboard widget to wp-admin.
 *
 * @package automattic/jetpack-newsletter
 */

namespace Automattic\Jetpack\Newsletter;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;
use Automattic\Jetpack\Tracking;
use Jetpack_Tracks_Client;

/**
 * Register and render the Daily Writing Prompt dashboard widget.
 */
class Writing_Prompt_Widget {
	/**
	 * Whether the class has been initialized.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Initialize the Daily Writing Prompt widget.
	 *
	 * Hooks the widget registration into `wp_dashboard_setup`. It can be called
	 * multiple times safely as it will only initialize once.
	 *
	 * @since 0.9.0
	 *
	 * @return void
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}

		self::$initialized = true;

		add_action( 'wp_dashboard_setup', array( __CLASS__, 'register_widget' ) );
	}

	/**
	 * Register the Daily Writing Prompt dashboard widget.
	 *
	 * @since 0.9.0
	 *
	 * @return void
	 */
	public static function register_widget() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		if ( ! self::should_load() ) {
			return;
		}

		wp_add_dashboard_widget(
			'wpcom_daily_writing_prompt',
			__( 'Daily Writing Prompt', 'jetpack-newsletter' ),
			array( __CLASS__, 'render_widget' ),
			null, // @phan-suppress-current-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. See https://core.trac.wordpress.org/ticket/52539.
			array(),
			'side',
			'high'
		);

		// Enqueue here (on wp_dashboard_setup, which only fires on the dashboard
		// screen and runs before the header is printed) rather than in the render
		// callback, so the stylesheet lands in the head like it did previously.
		self::enqueue_assets();
	}

	/**
	 * Whether the Daily Writing Prompt widget should load.
	 *
	 * The widget fetches prompts from WordPress.com through the Jetpack proxy, so
	 * it can only load where the site is able to reach WordPress.com: on Simple
	 * sites, or on online, connected Jetpack sites (including Atomic).
	 *
	 * This runs on `wp_dashboard_setup` rather than at plugin-load time so that
	 * the connection check happens after Core's pluggable functions are loaded.
	 * Checking the connection any earlier triggers a fatal error on Atomic.
	 *
	 * @since 0.9.1
	 *
	 * @return bool
	 */
	private static function should_load() {
		// Simple sites can always reach WordPress.com, with no Jetpack connection involved.
		if ( ( new Host() )->is_wpcom_simple() ) {
			return true;
		}

		// Everywhere else the widget needs an online, connected site to fetch prompts.
		return ( new Connection_Manager() )->is_connected() && ! ( new Status() )->is_offline_mode();
	}

	/**
	 * Enqueue the assets used to display the Daily Writing Prompt widget.
	 *
	 * @since 0.9.0
	 *
	 * @return string The script/style handle.
	 */
	public static function enqueue_assets() {
		$handle    = 'jetpack-newsletter-writing-prompt';
		$js_path   = dirname( __DIR__ ) . '/build/writing-prompt.js';
		$asset_php = dirname( __DIR__ ) . '/build/writing-prompt.asset.php';

		if ( ! file_exists( $js_path ) ) {
			return $handle;
		}

		$asset_file   = file_exists( $asset_php ) ? include $asset_php : array();
		$dependencies = $asset_file['dependencies'] ?? array();
		$version      = $asset_file['version'] ?? filemtime( $js_path );

		wp_enqueue_script(
			$handle,
			plugins_url( '../build/writing-prompt.js', __FILE__ ),
			$dependencies,
			$version,
			true
		);
		wp_set_script_translations( $handle, 'jetpack-newsletter' );

		// Load the Tracks transport so the widget's analytics events can fire.
		Tracking::register_tracks_functions_scripts( true );

		// Expose the connected user's Tracks identity to the widget script.
		add_filter( 'jetpack_admin_js_script_data', array( __CLASS__, 'add_script_data' ) );

		$css_ext  = is_rtl() ? 'rtl.css' : 'css';
		$css_path = dirname( __DIR__ ) . "/build/writing-prompt.$css_ext";
		if ( file_exists( $css_path ) ) {
			wp_enqueue_style(
				$handle,
				plugins_url( "../build/writing-prompt.$css_ext", __FILE__ ),
				array(),
				$version
			);
		}

		return $handle;
	}

	/**
	 * Add the connected user's Tracks identity to the admin script data.
	 *
	 * Mirrors the `newsletter.tracksUserData` shape provided by the Newsletter
	 * settings page so the widget can reuse the same `getNewsletterScriptData()`
	 * helper and `analytics.initialize()` flow.
	 *
	 * @since 0.9.1
	 *
	 * @param array $data The script data.
	 * @return array The filtered script data.
	 */
	public static function add_script_data( $data ) {
		if ( ! isset( $data['newsletter'] ) || ! is_array( $data['newsletter'] ) ) {
			$data['newsletter'] = array();
		}

		$data['newsletter']['tracksUserData'] = Jetpack_Tracks_Client::get_connected_user_tracks_identity();

		return $data;
	}

	/**
	 * Render the container of the Daily Writing Prompt widget.
	 *
	 * The widget is hydrated client-side by the `writing-prompt` JS entry, which
	 * mounts the React app into the container rendered here.
	 *
	 * @since 0.9.0
	 *
	 * @return void
	 */
	public static function render_widget() {
		$warning = __( 'Your Daily Writing Prompt widget requires JavaScript to function properly.', 'jetpack-newsletter' );

		?>
		<div>
			<div class="hide-if-js">
				<?php echo esc_html( $warning ); ?>
			</div>
			<div
				id="wpcom_daily_writing_prompt_main"
				class="wpcom_daily_writing_prompt hide-if-no-js"
				style="height: 100%">
			</div>
		</div>
		<?php
	}
}
