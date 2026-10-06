<?php
/**
 * Explains, in the block editor, why a saved Jetpack block is unavailable.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Plugin;

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Status;
use Jetpack;
use Jetpack_Gutenberg;
use Jetpack_Modules_Overrides;

/**
 * Works out why Jetpack is not registering its blocks, so the editor can say so
 * instead of showing core's generic "doesn't include support" warning.
 */
class Unavailable_Blocks {

	const SCRIPT_HANDLE = 'jetpack-unavailable-blocks-notice';

	/**
	 * Top-level blocks that are not registered while their module is inactive.
	 *
	 * Child blocks are left out: an unregistered parent swallows them into one missing block.
	 * `jetpack/wordads` is left out because a plan gates it as well.
	 */
	const FEATURE_BLOCKS = array(
		'subscriptions' => array( 'jetpack/subscriptions', 'jetpack/subscriber-login', 'jetpack/paywall' ),
		'stats'         => array( 'jetpack/blog-stats', 'jetpack/top-posts' ),
		'related-posts' => array( 'jetpack/related-posts' ),
		'contact-form'  => array( 'jetpack/contact-form' ),
		'podcast'       => array( 'jetpack/podcast-episode' ),
		'videopress'    => array( 'videopress/all-playlists', 'videopress/latest-videos-playlist', 'videopress/playlist' ),
	);

	/**
	 * Blocks registered by their own package, whether or not the Blocks module is active.
	 */
	const INDEPENDENT_BLOCKS = array( 'jetpack/contact-form', 'jetpack/podcast-episode' );

	/**
	 * Hook into the block editor.
	 *
	 * @since $$next-version$$
	 */
	public static function init() {
		add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'enqueue_site_wide_notice' ) );
	}

	/**
	 * Load the standalone notice when no Jetpack block is registered at all.
	 *
	 * Otherwise Jetpack's own editor bundle is on the page and carries the same notice.
	 *
	 * @since $$next-version$$
	 */
	public static function enqueue_site_wide_notice() {
		if ( ! wp_should_load_block_editor_scripts_and_styles() ) {
			return;
		}

		$data = self::get_editor_data();
		if ( null === $data || null === $data['reason'] ) {
			return;
		}

		Assets::register_script(
			self::SCRIPT_HANDLE,
			Jetpack_Gutenberg::get_blocks_directory() . 'unavailable-blocks-notice.js',
			JETPACK__PLUGIN_FILE,
			array(
				'textdomain' => 'jetpack',
				'enqueue'    => true,
			)
		);
		wp_add_inline_script(
			self::SCRIPT_HANDLE,
			'var Jetpack_Unavailable_Blocks = ' . wp_json_encode( $data, JSON_HEX_TAG | JSON_HEX_AMP ) . ';',
			'before'
		);
	}

	/**
	 * Get what the editor needs to explain an unavailable Jetpack block.
	 *
	 * @since $$next-version$$
	 *
	 * @return array|null Null when there is nothing the editor should explain.
	 */
	public static function get_editor_data() {
		// The mobile apps fetch editor assets over REST, where wp-admin links are no use.
		if ( Constants::is_true( 'REST_REQUEST' ) ) {
			return null;
		}

		$reason   = self::get_site_wide_reason();
		$features = self::get_inactive_feature_blocks();

		if ( null === $reason && empty( $features ) ) {
			return null;
		}

		$is_disconnected = 'not_connected' === $reason;

		return array(
			'reason'           => $reason,
			'canFix'           => current_user_can( $is_disconnected ? 'jetpack_connect' : 'jetpack_manage_modules' ),
			'fixUrl'           => admin_url( $is_disconnected ? 'admin.php?page=jetpack' : 'admin.php?page=jetpack#/writing' ),
			'features'         => $features,
			'canManageModules' => current_user_can( 'jetpack_manage_modules' ),
			'modulesUrl'       => admin_url( 'admin.php?page=jetpack_modules' ),
			'independent'      => self::INDEPENDENT_BLOCKS,
			'ignored'          => Jetpack_Gutenberg::get_deprecated_blocks(),
		);
	}

	/**
	 * Get the reason no Jetpack block from the Blocks module is registered, if there is one.
	 *
	 * @since $$next-version$$
	 *
	 * @return string|null `not_connected`, `blocks_module`, `disabled`, or null.
	 */
	public static function get_site_wide_reason() {
		if ( ! Jetpack::is_connection_ready() && ! ( new Status() )->is_offline_mode() ) {
			return 'not_connected';
		}

		// Not Jetpack_Gutenberg::should_load(): a filter returning true cannot load an inactive module.
		if ( ! ( new Modules() )->is_active( 'blocks' ) ) {
			return self::is_forced_off( 'blocks' ) ? 'disabled' : 'blocks_module';
		}

		/** This filter is documented in class.jetpack-gutenberg.php */
		if ( ! apply_filters( 'jetpack_gutenberg', true ) ) {
			return 'disabled';
		}

		return null;
	}

	/**
	 * Get the blocks that are unregistered because their own module is inactive.
	 *
	 * @since $$next-version$$
	 *
	 * @return array Block name => array( 'name' => module name, 'forced' => bool ).
	 */
	public static function get_inactive_feature_blocks() {
		// Offline mode drops connection-dependent blocks whatever their module's state.
		if ( ( new Status() )->is_offline_mode() ) {
			return array();
		}

		$modules = new Modules();
		$blocks  = array();

		foreach ( self::FEATURE_BLOCKS as $module => $block_names ) {
			if ( $modules->is_active( $module ) ) {
				continue;
			}

			// The Stats blocks also need a connected owner, so the module may not be the cause.
			if ( 'stats' === $module && ! ( new Connection_Manager( 'jetpack' ) )->has_connected_owner() ) {
				continue;
			}

			$feature = array(
				'name'   => self::get_module_name( $module ),
				'forced' => self::is_forced_off( $module ),
			);
			foreach ( $block_names as $block_name ) {
				$blocks[ $block_name ] = $feature;
			}
		}

		return $blocks;
	}

	/**
	 * Whether a filter or the host's feature policy keeps a module inactive.
	 *
	 * @param string $module Module slug.
	 * @return bool
	 */
	private static function is_forced_off( $module ) {
		return 'inactive' === Jetpack_Modules_Overrides::instance()->get_module_override( $module );
	}

	/**
	 * Get a module's translated name.
	 *
	 * @param string $module Module slug.
	 * @return string
	 */
	private static function get_module_name( $module ) {
		// Jetpack::get_module() returns the untranslated file header.
		$i18n = function_exists( 'jetpack_get_module_i18n' ) ? jetpack_get_module_i18n( $module ) : array();
		if ( ! empty( $i18n['name'] ) ) {
			return $i18n['name'];
		}

		$info = Jetpack::get_module( $module );
		return is_array( $info ) && ! empty( $info['name'] ) ? $info['name'] : $module;
	}
}
