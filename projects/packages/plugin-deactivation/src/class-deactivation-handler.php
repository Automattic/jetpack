<?php
/**
 * Intercept deactivation of plugins.
 *
 * @package automattic/jetpack-plugin-deactivation
 */

namespace Automattic\Jetpack\Plugin_Deactivation;

use Automattic\Jetpack\Assets;

/**
 * Handles plugin deactivation.
 *
 * Instantiates the deactivation handler to intercept the deactivation of plugins.
 */
class Deactivation_Handler {

	/**
	 * Plugin Deactivation package version
	 *
	 * @var string
	 */
	const PACKAGE_VERSION = '0.3.5';

	/**
	 * Slug of the plugin to intercept deactivation for.
	 *
	 * @var string
	 */
	private $plugin;

	/**
	 * Path to a PHP file that will be used as a template for the deactivation dialog.
	 *
	 * Copy ./dialog-template.php to your plugin and modify it to suit your needs.
	 *
	 * @var string
	 */
	private $dialog_view;

	/**
	 * Constructor.
	 *
	 * @param string $plugin      Slug of the plugin to intercept deactivation for.
	 * @param string $dialog_view Path to a PHP file that will be used as a template for the deactivation dialog.
	 */
	public function __construct( $plugin, $dialog_view ) {
		$this->plugin      = $plugin;
		$this->dialog_view = $dialog_view;
	}

	/**
	 * Instantiates the deactivation handler to intercept the deactivation of plugins.
	 *
	 * @param string $plugin      Slug of the plugin to intercept deactivation for.
	 * @param string $dialog_view Path to a PHP file that will be used as a template for the deactivation dialog.
	 */
	public static function init( $plugin, $dialog_view ) {
		$instance = new self( $plugin, $dialog_view );

		if ( ! file_exists( $instance->dialog_view ) ) {
			return new \WP_Error( 'no-template', 'The plugin deactivation dialog view file does not exist.' );
		}

		add_action( 'load-plugins.php', array( $instance, 'enqueue_script' ) );
		add_action( 'admin_footer-plugins.php', array( $instance, 'embed_dialog' ) );
		add_filter( 'jp_plugin_deactivation_data', array( $instance, 'add_deactivation_data' ) );

		return $instance;
	}

	/**
	 * Used by `jp_plugin_deactivation_data` filter to pass data to
	 * the JetpackPluginDeactivation class.
	 *
	 * @param array $data The data to pass to the JetpackPluginDeactivation class.
	 */
	public function add_deactivation_data( $data ) {
		$data['slugs'][] = $this->plugin;
		return $data;
	}

	/**
	 * Enqueues the deactivation handler script and styles.
	 */
	public function enqueue_script() {
		Assets::register_script(
			'jetpack-plugin-deactivation',
			'../build/index.js',
			__FILE__,
			array(
				'enqueue'    => true,
				'in_footer'  => true,
				'textdomain' => 'jetpack-plugin-deactivation',
			)
		);

		/**
		 * This is going to pass plugin slugs to the script.
		 */
		$data = array(
			'slugs' => array(),
		);
		wp_localize_script( 'jetpack-plugin-deactivation', 'JetpackPluginDeactivationData', apply_filters( 'jp_plugin_deactivation_data', $data ) );
	}

	/**
	 * Add required html to the plugin page footer.
	 */
	public function embed_dialog() {
		?>
		<div
			id="jp-plugin-deactivation-<?php echo esc_attr( $this->plugin ); ?>"
			data-jp-plugin-deactivation="<?php echo esc_attr( $this->plugin ); ?>"
			class="jp-plugin-deactivation"
		>
			<div class="jp-plugin-deactivation__dialog">
				<?php include $this->dialog_view; ?>
			</div>
			<div
					data-jp-plugin-deactivation-action="close"
					class="jp-plugin-deactivation__overlay"
			></div>
		</div>
		<?php
	}
}
