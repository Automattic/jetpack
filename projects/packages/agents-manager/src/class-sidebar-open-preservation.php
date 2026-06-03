<?php
/**
 * Sidebar Open Watcher file.
 *
 * @package automattic/jetpack-agents-manager
 */

namespace Automattic\Jetpack\Agents_Manager;

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Constants;

/**
 * Preserves Agents Manager sidebar-open body classes across full wp-admin navigations.
 */
class Sidebar_Open_Preservation {
	/**
	 * Class instance.
	 *
	 * @var Sidebar_Open_Preservation
	 */
	private static $instance;

	/**
	 * The cookie key for the agents manager chat sidebar open state.
	 *
	 * @var string
	 */
	private const COOKIE_KEY = 'agents_manager_chat_sidebar_open';

	/**
	 * The class name for the agents manager sidebar open state.
	 *
	 * @var string
	 */
	private const SIDEBAR_OPEN_CLASS = 'agents-manager-sidebar-container--sidebar-open';

	/**
	 * Creates instance.
	 *
	 * @return void
	 */
	public static function init() {
		if ( self::$instance === null ) {
			self::$instance = new self();
		}
	}

	/**
	 * Sidebar_Open_Preservation constructor.
	 */
	public function __construct() {
		add_filter( 'admin_body_class', array( $this, 'add_preopen_body_classes' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_sidebar_open_watcher_script' ), 1 );
	}

	/**
	 * Inject pre-open assistant classes in initial admin body markup.
	 *
	 * Cookie reflects sidebar open (not chat docked).
	 *
	 * @param string $classes Existing admin body classes.
	 * @return string
	 */
	public function add_preopen_body_classes( string $classes ): string {
		if ( ! $this->should_preserve_sidebar_open_state() ) {
			return $classes;
		}

		$cookie_value = isset( $_COOKIE[ self::COOKIE_KEY ] )
			? sanitize_text_field( wp_unslash( (string) $_COOKIE[ self::COOKIE_KEY ] ) )
			: '';
		$is_open      = '1' === $cookie_value;

		if ( ! $is_open ) {
			return $classes;
		}

		return implode(
			' ',
			array_filter(
				array(
					$classes,
					'agents-manager-sidebar-container',
					self::SIDEBAR_OPEN_CLASS,
				)
			)
		);
	}

	/**
	 * Enqueue the locally bundled Sidebar Open Watcher script.
	 *
	 * Keeps the sidebar open-state cookie in sync with the admin body
	 * class. Built by webpack into `build/sidebar-open-watcher.js`;
	 * the sibling `.asset.php` supplies dependencies and version.
	 */
	public function enqueue_sidebar_open_watcher_script() {
		if ( ! $this->should_preserve_sidebar_open_state() ) {
			return;
		}

		$script_handle = 'jetpack-agents-manager-sidebar-open-watcher';

		Assets::register_script(
			$script_handle,
			'../build/sidebar-open-watcher.js',
			__FILE__,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-agents-manager',
			)
		);

		$script_data = array(
			'cookieKey'        => self::COOKIE_KEY,
			'cookiePath'       => Constants::get_constant( 'ADMIN_COOKIE_PATH' ),
			'sidebarOpenClass' => self::SIDEBAR_OPEN_CLASS,
		);

		$script_data = wp_json_encode(
			$script_data,
			JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_UNICODE
		);

		wp_add_inline_script(
			$script_handle,
			sprintf( 'window.AgentsManagerSidebarOpenWatcherData = %s;', $script_data ),
			'before'
		);

		Assets::enqueue_script( $script_handle );
	}

	/**
	 * Whether sidebar open preservation should run for this request.
	 *
	 * @return bool
	 */
	private function should_preserve_sidebar_open_state(): bool {
		if ( ! is_admin() ) {
			return false;
		}

		/**
		 * Filter whether to use the unified Agents Manager experience.
		 *
		 * @since 0.1.0
		 *
		 * @param bool $use_unified Whether to use the unified experience.
		 */
		return (bool) apply_filters( 'agents_manager_use_unified_experience', false );
	}
}
