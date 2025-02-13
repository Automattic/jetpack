<?php
/**
 * A class that adds a newsletter widget to wp-admin.
 *
 * @package automattic/jetpack-
 */

namespace Automattic\Jetpack\Newsletter_Widget;

/**
 * Responsible for adding a newsletter widget to wp-admin.
 *
 * @package jetpack-newsletter-widget
 */
class Dashboard {
	/**
	 * Whether the class has been initialized
	 *
	 * @var boolean
	 */
	private static $initialized = false;

	/**
	 * Constructor.
	 */
	public function __construct() {
		if ( ! self::$initialized ) {
			self::$initialized = true;
			$this->admin_init();
		}
	}

	/**
	 * Override render funtion
	 */
	public function render() {
		?>
		<div id="wpcom" style="min-height: calc(100vh - 100px);">
			<div id="newsletter-widget-app"></div>
		</div>
		<?php
	}

	/**
	 * Initialize the admin resources.
	 */
	public function admin_init() {
		add_action( 'admin_enqueue_scripts', array( $this, 'load_admin_scripts' ) );
	}

	/**
	 * Load the admin scripts.
	 */
	public function load_admin_scripts() {
		( new Newsletter_Widget_Assets() )->load_admin_scripts( 'jp-newsletter-widget', 'app.min', array( 'config_variable_name' => 'jetpackNewsletterWidgetConfigData' ) );
	}
}
