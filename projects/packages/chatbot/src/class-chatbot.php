<?php
/**
 * Jetpack Chatbot: Helpful bots for your WordPress site.
 *
 * @package automattic/jetpack-chatbot
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\Chatbot\REST_Controller as Chat_Rest_Controller;
use Automattic\Jetpack\Connection\Manager as Jetpack_Connection;

/**
 * Class description.
 */
class Chatbot {

	/**
	 * Version of the JS file.
	 */
	const PACKAGE_VERSION = '0.1.0-alpha';

	/**
	 * Constructor.
	 */
	public static function init() {
		$connection = new Jetpack_Connection();
		if ( ! $connection->is_user_connected() ) {
			add_action( 'admin_notices', array( __CLASS__, 'please_connect_first_notice' ) );
			return;
		}

		// Inject div element with id jetpack-chatbot-root on every page, front end and back end.
		add_action( 'wp_footer', array( __CLASS__, 'inject_jetpack_chatbot_root' ) );
		add_action( 'admin_notices', array( __CLASS__, 'inject_jetpack_chatbot_root' ) );

		// Enqueue Chat app on every page, front end and back end.
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'enqueue_jetpack_chatbot_scripts' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_jetpack_chatbot_scripts' ) );

		add_action( 'rest_api_init', array( new Chat_Rest_Controller(), 'register_rest_routes' ) );
	}

	/**
	 * Displays a notice to the user to connect to WordPress.com first.
	 */
	public static function please_connect_first_notice() {
		?>
		<div class="notice notice-warning is-dismissible">
			<p><?php esc_html_e( 'Jetpack Chatbot requires a wordpress.com connection.', 'jetpack-chatbot' ); ?></p>
			<p><a href="<?php echo esc_url( admin_url( 'admin.php?page=jetpack-starter-plugin' ) ); ?>"><?php esc_html_e( 'Connect to chat', 'jetpack-chatbot' ); ?></a></p>
		</div>
		<?php
	}

	/**
	 * Injects the DOM element that the widget is targeted.
	 */
	public static function inject_jetpack_chatbot_root() {
		global $current_screen;
		if ( isset( $current_screen->id ) && $current_screen->id === 'jetpack_page_jetpack-chatbot' ) {
			return;
		}
		?>
			<div id="jetpack-chatbot-root"></div>
		<?php
	}

	/**
	 * Enqueues the Jetpack Odysseus scripts and styles.
	 */
	public static function enqueue_jetpack_chatbot_scripts() {
		wp_enqueue_script( 'jetpack-chatbot-widget', '//widgets.wp.com/odie/widget.js', array(), time(), true );

		$js_data = array(
			'isRunningInJetpack' => true,
			'jetpackXhrParams'   => array(
				'apiRoot'     => esc_url_raw( rest_url() ),
				'headerNonce' => wp_create_nonce( 'wp_rest' ),
			),
			'authToken'          => 'wpcom-proxy-request',
		);

		$js_config_data = 'window.JetpackXhrParams = ' . wp_json_encode( $js_data ) . ';';

		wp_add_inline_script( 'jetpack-chatbot-widget', $js_config_data, 'before' );

		Assets::register_script(
			'jetpack-chatbot-js',
			'../build/chatbot.js',
			__FILE__,
			array(
				'enqueue'      => true,
				'in_footer'    => true,
				'textdomain'   => 'jetpack-chatbot',
				'dependencies' => array( 'jetpack-chatbot-widget' ),
			)
		);
	}
}
