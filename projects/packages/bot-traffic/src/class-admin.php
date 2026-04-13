<?php
/**
 * Bot Traffic admin page.
 *
 * @package automattic/jetpack-bot-traffic
 */

namespace Automattic\Jetpack\Bot_Traffic;

use Automattic\Jetpack\Admin_UI\Admin_Menu;

/**
 * Registers the Bot Traffic admin page under the Jetpack menu.
 */
class Admin {

	/**
	 * Page hook suffix returned by add_menu.
	 *
	 * @var string
	 */
	private $page_hook;

	/**
	 * Initialize the admin page.
	 */
	public function init() {
		add_action( 'admin_menu', array( $this, 'register_menu' ), 1 );
	}

	/**
	 * Register the admin menu item.
	 */
	public function register_menu() {
		$this->page_hook = Admin_Menu::add_menu(
			__( 'Bot Traffic', 'jetpack-bot-traffic' ),
			__( 'Bot Traffic', 'jetpack-bot-traffic' ),
			'manage_options',
			'jetpack-bot-traffic',
			array( $this, 'render_page' ),
			3
		);

		add_action( 'load-' . $this->page_hook, array( $this, 'admin_init' ) );
	}

	/**
	 * Initialize admin page assets.
	 */
	public function admin_init() {
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
	}

	/**
	 * Enqueue scripts and styles.
	 */
	public function enqueue_scripts() {
		$build_dir  = __DIR__ . '/../build/';
		$asset_file = $build_dir . 'index.asset.php';

		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		$asset = require $asset_file;

		wp_enqueue_script(
			'jetpack-bot-traffic',
			plugins_url( '../build/index.js', __FILE__ ),
			$asset['dependencies'],
			$asset['version'],
			true
		);

		if ( file_exists( $build_dir . 'index.css' ) ) {
			wp_enqueue_style(
				'jetpack-bot-traffic',
				plugins_url( '../build/index.css', __FILE__ ),
				array( 'wp-components' ),
				$asset['version']
			);
		}

		wp_add_inline_script(
			'jetpack-bot-traffic',
			'window.botTrafficConfig = ' . wp_json_encode(
				array( 'siteUrl' => site_url() ),
				JSON_UNESCAPED_SLASHES
			) . ';',
			'before'
		);
	}

	/**
	 * Render the admin page.
	 */
	public function render_page() {
		?>
		<div id="jetpack-bot-traffic-root" class="jetpack-bot-traffic-dashboard"></div>
		<?php
	}
}
