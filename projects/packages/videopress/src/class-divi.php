<?php
/**
 * Divi integration for Videopress.
 *
 * @package automattic/jetpack-videopress
 **/

namespace Automattic\Jetpack\VideoPress;

/**
 * Class Divi
 **/
class Divi {
	/**
	 * The instance.
	 *
	 * @var Divi
	 **/
	private static $instance = null;

	/**
	 * Running or not.
	 *
	 * @var bool
	 **/
	private $running = false;

	/**
	 * Initializes VideoPress/Divi integration.
	 *
	 * Called only once by the Initializer class
	 *
	 * @return self
	 */
	public static function init() {
		return self::get_instance()->run();
	}

	/**
	 * Get the instance.
	 *
	 * @return self
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Run the extension.
	 *
	 * @return self
	 */
	public function run() {
		if ( $this->running ) {
			return $this;
		}

		$this->running = true;
		add_action( 'divi_extensions_init', array( $this, 'initialize_extension' ) );
		return $this;
	}

	/**
	 * Creates the extension's main class instance.
	 */
	public function initialize_extension() {
		require_once plugin_dir_path( __FILE__ ) . 'videopress-divi/class-videopress-divi-extension.php';
		$this->vidi_extension = new \VideoPress_Divi_Extension();
	}
}

