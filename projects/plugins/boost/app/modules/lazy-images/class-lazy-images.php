<?php
/**
 * Implements the Lazy Images feature.
 *
 * @link       https://automattic.com
 * @since      1.0.0
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Modules\Lazy_Images;

use Automattic\Jetpack\Jetpack_Lazy_Images;
use Automattic\Jetpack_Boost\Modules\Module;
use Jetpack;

/**
 * Class Lazy_Images
 */
class Lazy_Images extends Module {

	const MODULE_SLUG = 'lazy-images';

	/**
	 * Jetpack Boost plugin instance.
	 *
	 * @var \Automattic\Jetpack_Boost\Jetpack_Boost
	 */
	protected $jetpack_boost_plugin;

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct();

		add_action( 'jetpack_boost_loaded', array( $this, 'set_jetpack_boost_plugin_instance' ), 10, 1 );
		add_action( 'jetpack_loaded', array( $this, 'enable_jetpack_lazy_images_module' ) );
		add_filter( 'jetpack_boost_module_enabled', array( $this, 'set_default_module_status' ), 10, 2 );
		add_action( 'jetpack_boost_pre_set_module_status', array( $this, 'set_jetpack_lazy_images_module_status' ), 10, 2 );
		add_action( 'jetpack_boost_pre_is_module_enabled', array( $this, 'enable_module' ), 10, 2 );
		add_action( 'jetpack_activate_module', array( $this, 'action_jetpack_activate_module' ), 10, 2 );
		add_action( 'jetpack_deactivate_module', array( $this, 'action_jetpack_deactivate_module' ), 10, 2 );
	}

	/**
	 * Check whether the Jetpack Lazy Images module is enabled.
	 */
	public static function is_jetpack_lazy_images_module_enabled() {
		return class_exists( 'Jetpack' ) && Jetpack::is_module_active( self::MODULE_SLUG );
	}

	/**
	 * Set the Jetpack Boost plugin instance so this module can get access to the plugin config methods.
	 *
	 * @param \Automattic\Jetpack_Boost\Jetpack_Boost $jetpack_boost_plugin * Jetpack Boost plugin instance.
	 */
	public function set_jetpack_boost_plugin_instance( $jetpack_boost_plugin ) {
		$this->jetpack_boost_plugin = $jetpack_boost_plugin;
	}

	/**
	 * Allow enabling Jetpack Lazy Images module if the module is already enabled by Jetpack Boost.
	 */
	public function enable_jetpack_lazy_images_module() {
		if ( $this->jetpack_boost_plugin->is_module_enabled( 'false', self::MODULE_SLUG ) && ! self::is_jetpack_lazy_images_module_enabled() ) {
			Jetpack::activate_module( self::MODULE_SLUG, false, false );
		}
	}

	/**
	 * Set the default status for this module to true is the Jetpack Lazy Images module is already enabled.
	 *
	 * @param string $default_module_status Default module status.
	 * @param string $module_slug           Module slug.
	 *
	 * @return bool
	 */
	public function set_default_module_status( $default_module_status, $module_slug ) {
		if ( self::MODULE_SLUG === $module_slug && self::is_jetpack_lazy_images_module_enabled() ) {
			return true;
		}

		return $default_module_status;
	}

	/**
	 * Enable or disable the Jetpack Lazy Images module based on the status of this module and whether or not
	 * the Jetpack Lazy Images module is already enabled/disabled.
	 *
	 * @param bool   $is_enabled  Whether or not the Jetpack Lazy Images module is enabled.
	 * @param string $module_slug Module slug.
	 */
	public function set_jetpack_lazy_images_module_status( $is_enabled, $module_slug ) {
		if ( ! class_exists( 'Jetpack' ) ) {
			return;
		}

		if ( self::MODULE_SLUG === $module_slug && $is_enabled && ! self::is_jetpack_lazy_images_module_enabled() ) {
			Jetpack::activate_module( self::MODULE_SLUG, false, false );
		}

		if ( self::MODULE_SLUG === $module_slug && ! $is_enabled && self::is_jetpack_lazy_images_module_enabled() ) {
			Jetpack::deactivate_module( self::MODULE_SLUG );
		}
	}

	/**
	 * Enable this module in the Jetpack Boost plugin config if the Jetpack Lazy Images module is already enabled.
	 *
	 * @param bool   $is_enabled  Whether or not the Jetpack Lazy Images module is enabled.
	 * @param string $module_slug Module slug.
	 */
	public function enable_module( $is_enabled, $module_slug ) {
		if ( self::MODULE_SLUG === $module_slug && self::is_jetpack_lazy_images_module_enabled() ) {
			$this->jetpack_boost_plugin->config()->set_value( "$module_slug/enabled", true, true );
		}
	}

	/**
	 * Allow to enable this module when Jetpack Lazy Images module is getting enabled.
	 *
	 * @param string $module Module slug.
	 */
	public function action_jetpack_activate_module( $module ) {
		if ( self::MODULE_SLUG === $module ) {
			$this->jetpack_boost_plugin->config()->set_value( self::MODULE_SLUG . '/enabled', true, true );
		}
	}

	/**
	 * Allow to disable this module when Jetpack Lazy Images module is getting disabled.
	 *
	 * @param string $module Module slug.
	 */
	public function action_jetpack_deactivate_module( $module ) {
		if ( self::MODULE_SLUG === $module ) {
			$this->jetpack_boost_plugin->config()->set_value( self::MODULE_SLUG . '/enabled', false, true );
		}
	}

	/**
	 * Code to run when module is started.
	 */
	protected function on_initialize() {
		if ( ! self::is_jetpack_lazy_images_module_enabled() ) {
			add_action( 'wp', array( Jetpack_Lazy_Images::class, 'instance' ) );
		}
	}
}
