<?php
/**
 * Explains, in the block editor, why a saved Jetpack block is unavailable.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Plugin;

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;
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
	 * Blocks that stay registered in the editor while the Blocks module is inactive.
	 */
	const INDEPENDENT_BLOCKS = array( 'jetpack/contact-form' );

	/**
	 * Top-level blocks that packages register, which the plugin's block manifest does not list.
	 */
	const PACKAGE_BLOCKS = array(
		'jetpack/contact-form',
		'jetpack/podcast-episode',
		'jetpack/paypal-payment-buttons',
		'videopress/video',
		'videopress/all-playlists',
		'videopress/latest-videos-playlist',
		'videopress/playlist',
	);

	/**
	 * Manifest blocks that a plan or site setting can also keep unregistered.
	 */
	const CONDITIONAL_BLOCKS = array( 'jetpack/cookie-consent', 'jetpack/voice-to-content', 'jetpack/wordads' );

	/**
	 * Hook into the block editor.
	 *
	 * @since 16.4
	 */
	public static function init() {
		add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'enqueue_site_wide_notice' ) );
	}

	/**
	 * Load the standalone notice when no Jetpack block is registered at all.
	 *
	 * Otherwise Jetpack's own editor bundle is on the page and carries the same notice.
	 *
	 * @since 16.4
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
	 * Get what the standalone notice needs when no Jetpack block from the Blocks module is registered.
	 *
	 * @since 16.4
	 *
	 * @return array|null Null when there is nothing site-wide to explain.
	 */
	public static function get_editor_data() {
		// The mobile apps fetch editor assets over REST, where wp-admin links are no use.
		if ( Constants::is_true( 'REST_REQUEST' ) ) {
			return null;
		}

		$reason = self::get_site_wide_reason();
		if ( null === $reason ) {
			return null;
		}

		$is_disconnected = 'not_connected' === $reason;
		$features        = array();

		// The form registers without the Blocks module, so Forms itself can be the cause.
		if ( ! ( new Modules() )->is_active( 'contact-form' ) ) {
			$forms = self::get_inactive_module_details( 'contact-form' );
			if ( $forms ) {
				$features['jetpack/contact-form'] = $forms;
			}
		}

		return array(
			'reason'           => $reason,
			'canFix'           => current_user_can( $is_disconnected ? 'jetpack_connect' : 'jetpack_manage_modules' ),
			'fixUrl'           => admin_url( $is_disconnected ? 'admin.php?page=jetpack' : 'admin.php?page=jetpack#/writing' ),
			'features'         => $features,
			'canManageModules' => current_user_can( 'jetpack_manage_modules' ),
			'modulesUrl'       => admin_url( 'admin.php?page=jetpack_modules' ),
			'independent'      => self::INDEPENDENT_BLOCKS,
			'shipped'          => self::get_shipped_blocks(),
		);
	}

	/**
	 * Get the reason no Jetpack block from the Blocks module is registered, if there is one.
	 *
	 * @since 16.4
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
	 * Add each inactive module's name and forced state to blocks that reported one when they bailed out.
	 *
	 * @since 16.4
	 *
	 * @param array $availability Block availability, as from Jetpack_Gutenberg::get_availability().
	 * @return array The same availability, with module details filled in or dropped.
	 */
	public static function describe_inactive_modules( $availability ) {
		foreach ( (array) $availability as $slug => $entry ) {
			if ( isset( $entry['details']['module'] ) && is_string( $entry['details']['module'] ) ) {
				$availability[ $slug ]['details'] = self::get_inactive_module_details( $entry['details']['module'] );
			}
		}

		return $availability;
	}

	/**
	 * Describe an inactive module for the editor's explanation of a block that needs it.
	 *
	 * @since 16.4
	 *
	 * @param string $module Module slug.
	 * @return array Module slug, name, and whether it is forced off; empty when the editor should not name it.
	 */
	public static function get_inactive_module_details( $module ) {
		if ( ( new Host() )->is_wpcom_simple() ) {
			return array();
		}

		$info = ( new Modules() )->get( $module );
		if ( ! is_array( $info ) ) {
			return array();
		}

		// Offline mode keeps connection-dependent modules off, so their toggle would not help.
		if ( ! empty( $info['requires_connection'] ) && ( new Status() )->is_offline_mode() ) {
			return array();
		}

		// Modules::get() returns the untranslated file header.
		$i18n = function_exists( 'jetpack_get_module_i18n' ) ? jetpack_get_module_i18n( $module ) : array();

		return array(
			'module'      => $module,
			'module_name' => ! empty( $i18n['name'] ) ? $i18n['name'] : ( ! empty( $info['name'] ) ? $info['name'] : $module ),
			'forced'      => self::is_forced_off( $module ),
		);
	}

	/**
	 * Get the top-level blocks this site would register with nothing turned off.
	 *
	 * @since 16.4
	 *
	 * @return string[] Block names.
	 */
	public static function get_shipped_blocks() {
		$manifest_file = JETPACK__PLUGIN_DIR . '_inc/blocks/blocks-manifest.php';
		$manifest      = file_exists( $manifest_file ) ? require $manifest_file : array();
		$extensions    = Jetpack_Gutenberg::get_available_extensions();
		$blocks        = self::PACKAGE_BLOCKS;

		foreach ( (array) $manifest as $extension => $metadata ) {
			if ( in_array( $extension, $extensions, true ) && ! empty( $metadata['name'] ) ) {
				$blocks[] = $metadata['name'];
			}
		}

		return array_values( array_diff( $blocks, self::CONDITIONAL_BLOCKS ) );
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
}
