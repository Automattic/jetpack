<?php
/**
 * Divi integration for Videopress.
 *
 * @package automattic/jetpack-videopress
 **/

use Automattic\Jetpack\Assets;

/**
 * Divi extension.
 **/
class VideoPress_Divi_Extension extends DiviExtension {

	/**
	 * The extension's js file namespace.
	 *
	 * @var string
	 */
	const JETPACK_VIDEOPRESS_DIVI_PKG_NAMESPACE = 'jetpack-videopress-divi-pkg';

	/**
	 * The gettext domain for the extension's translations.
	 *
	 * @since 0.14.0
	 *
	 * @var string
	 */
	public $gettext_domain = 'jetpack-videopress-pkg';

	/**
	 * The extension's WP Plugin name.
	 *
	 * @since 0.14.0
	 *
	 * @var string
	 */
	public $name = 'videopress-divi';

	/**
	 * The extension's version
	 *
	 * @since 0.14.0
	 *
	 * @var string
	 */
	public $version = '1.0.0';

	/**
	 * The VideoPress_Divi_Module.
	 *
	 * @since 0.14.0
	 *
	 * @var VideoPress_Divi_Module
	 */
	private $videopress_divi_module;

	/**
	 * Plugin directory.
	 *
	 * @var string
	 */
	public $plugin_dir;

	/**
	 * Plugin directory URL.
	 *
	 * @var string
	 */
	public $plugin_dir_url;

	/**
	 * The constructor.
	 *
	 * @param string $name The name.
	 * @param array  $args The args.
	 */
	public function __construct( $name = 'videopress-divi', $args = array() ) {
		$this->plugin_dir     = plugin_dir_path( __FILE__ );
		$this->plugin_dir_url = plugin_dir_url( $this->plugin_dir );

		parent::__construct( $name, $args );
	}

	/**
	 * Executes when the ET builder module is loaded.
	 *
	 * @override
	 */
	public function hook_et_builder_modules_loaded() {
		$this->hook_et_builder_ready();
	}

	/**
	 * Loads custom modules when the builder is ready.
	 *
	 * @override
	 */
	public function hook_et_builder_ready() {
		require_once plugin_dir_path( __FILE__ ) . 'class-videopress-divi-module.php';
		$this->videopress_divi_module = new VideoPress_Divi_Module();
	}

	/**
	 * Performs initialization tasks.
	 *
	 * @Override
	 */
	protected function _initialize() { // phpcs:ignore PSR2.Methods.MethodDeclaration.Underscore
		DiviExtensions::add( $this );

		$this->_set_debug_mode();
		$this->_set_bundle_dependencies();

		// Register callbacks.
		register_activation_hook( trailingslashit( $this->plugin_dir ) . $this->name . '.php', array( $this, 'wp_hook_activate' ) );

		add_action( 'et_builder_ready', array( $this, 'hook_et_builder_ready' ), 9 );
		add_action( 'wp_enqueue_scripts', array( $this, 'wp_hook_enqueue_scripts' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'admin_hook_enqueue_scripts' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'register_js_assets' ) );
	}

	/**
	 * Register the extension's js assets.
	 */
	public function register_js_assets() {
		Assets::register_script(
			self::JETPACK_VIDEOPRESS_DIVI_PKG_NAMESPACE,
			'../../build/divi-editor/index.js',
			__FILE__,
			array(
				'in_footer'    => true,
				'css_path'     => '../../build/divi-editor/index.css',
				'textdomain'   => 'jetpack-videopress-pkg',
				'dependencies' => array( 'jquery' ),
			)
		);

		Assets::enqueue_script( self::JETPACK_VIDEOPRESS_DIVI_PKG_NAMESPACE );
	}

	/**
	 * Enqueue frontend stuff.
	 *
	 * @override
	 */
	public function wp_hook_enqueue_scripts() {
	}
}
