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
	 * Feedback form url to redicret to, on deactivation.
	 *
	 * @var string
	 */
	private $feedback_url;

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
	 * @param string $feedback_url Feedback form url to redicret to, on deactivation.
	 * @param string $dialog_view  Path to a PHP file that will be used as a template for the deactivation dialog.
	 */
	public function __construct( $plugin, $feedback_url, $dialog_view ) {
		$this->plugin       = $plugin;
		$this->feedback_url = $feedback_url;
		$this->dialog_view  = $dialog_view;

		add_action( 'load-plugins.php', array( $this, 'enqueue_script' ) );
		add_action( 'admin_footer-plugins.php', array( $this, 'embed_dialog' ) );
	}

	/**
	 * Instantiates the deactivation handler to intercept the deactivation of plugins.
	 *
	 * @param string $plugin       Slug of the plugin to intercept deactivation for.
	 * @param string $feedback_url Feedback form url to redicret to, on deactivation.
	 * @param string $dialog_view  Path to a PHP file that will be used as a template for the deactivation dialog.
	 */
	public static function init( $plugin, $feedback_url, $dialog_view ) {
		$instance = new self( $plugin, $feedback_url, $dialog_view );
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
		<div id="jp-plugin-deactivation-<?php esc_attr( $this->plugin ); ?>" class="jp-plugin-deactivation">
			<div class="jp-plugin-deactivation__dialog">
				<?php include $this->dialog_view; ?>
			</div>
			<div class="jp-plugin-deactivation__overlay" onclick="dispatchEvent(JetpackPluginDeactivation.events.close)"></div>
		</div>
		<script>new JetpackPluginDeactivation("<?php echo esc_attr( $this->plugin ); ?>", "<?php echo esc_url( $this->feedback_url ); ?>");</script>
		<?php
	}
}
