<?php
/**
 * Intercept deactivation of plugins.
 *
 * @package automattic/jetpack-plugin-deactivation
 */

namespace Automattic\Jetpack\Plugin_Deactivation;

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
	const PACKAGE_VERSION = '0.1.0-alpha';

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
	 * @param string $plugin       Slug of the plugin to intercept deactivation for.
	 * @param string $dialog_view  Path to a PHP file that will be used as a template for the deactivation dialog.
	 */
	public function __construct( $plugin, $dialog_view ) {
		$this->plugin      = $plugin;
		$this->dialog_view = $dialog_view;
	}

	/**
	 * Instantiates the deactivation handler to intercept the deactivation of plugins.
	 *
	 * @param string $plugin       Slug of the plugin to intercept deactivation for.
	 * @param string $dialog_view  Path to a PHP file that will be used as a template for the deactivation dialog.
	 */
	public static function init( $plugin, $dialog_view ) {
		$instance = new self( $plugin, $dialog_view );

		if ( ! file_exists( $instance->dialog_view ) ) {
			wp_die( 'The plugin deactivation dialog view file does not exist.' );
		}

		add_action( 'load-plugins.php', array( $instance, 'enqueue_script' ) );
		add_action( 'admin_footer-plugins.php', array( $instance, 'embed_dialog' ) );

		return $instance;
	}

	/**
	 * Enqueues the deactivation handler script and styles.
	 */
	public function enqueue_script() {
		wp_enqueue_script(
			'jp-plugin-deactivation',
			plugins_url( '../dist/deactivation.js', __FILE__ ),
			array(),
			self::PACKAGE_VERSION,
			true
		);

		wp_enqueue_style(
			'jp-plugin-deactivation',
			plugins_url( '../dist/deactivation.css', __FILE__ ),
			array(),
			self::PACKAGE_VERSION
		);
	}

	/**
	 * Add required html to the plugin page footer.
	 */
	public function embed_dialog() {
		?>
		<div id="jp-plugin-deactivation-<?php echo esc_attr( $this->plugin ); ?>" class="jp-plugin-deactivation">
			<div class="jp-plugin-deactivation__dialog">
				<?php include $this->dialog_view; ?>
			</div>
			<div 
				data-jp-plugin-deactivation-action="close"
				class="jp-plugin-deactivation__overlay"
			></div>
		</div>
		<script>new JetpackPluginDeactivation( decodeURIComponent( '<?php echo rawurlencode( $this->plugin ); ?>' ) );</script>
		<?php
	}
}
