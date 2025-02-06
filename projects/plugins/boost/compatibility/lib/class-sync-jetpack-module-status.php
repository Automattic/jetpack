<?php
namespace Automattic\Jetpack_Boost\Compatibility\Jetpack;

/**
 * Class that handles the sync of Jetpack module status to Boost module status.
 */
class Sync_Jetpack_Module_Status {

	/**
	 * Slug of the Jetpack module
	 *
	 * @var string
	 */
	public $jetpack_module_slug;

	/**
	 * Slug of the Boost module
	 *
	 * @var string
	 */
	public $boost_module_slug;

	public function __construct( $boost_module_slug, $jetpack_module_slug ) {
		$this->boost_module_slug   = str_replace( '_', '-', $boost_module_slug );
		$this->jetpack_module_slug = $jetpack_module_slug;
	}

	public function init() {
		// Use Jetpack as the source of truth for the module status
		add_filter( "default_option_jetpack_boost_status_{$this->boost_module_slug}", array( $this, 'get_jetpack_module_status' ) );
		add_filter( "option_jetpack_boost_status_{$this->boost_module_slug}", array( $this, 'get_jetpack_module_status' ) );

		$this->add_sync_to_jetpack_action();
		$this->add_sync_from_jetpack_action();

		/**
		 * Update the Jetpack Boost option to match the Jetpack option,
		 * in case the options are out of sync when the page is loaded.
		 */
		add_action( 'load-jetpack_page_jetpack-boost', array( $this, 'sync_from_jetpack' ) );
	}

	/**
	 * Get the status of the Jetpack module
	 *
	 * @return string
	 */
	public function get_jetpack_module_status() {
		return (string) \Jetpack::is_module_active( $this->jetpack_module_slug );
	}

	/**
	 * Forward all module status changes to Jetpack
	 * when interacting with Jetpack Boost dashboard.
	 */
	public function sync_to_jetpack( $_unused, $new_value ) {
		$this->remove_sync_from_jetpack_action();

		if ( $new_value ) {
			\Jetpack::activate_module( $this->jetpack_module_slug, false, false );
		} else {
			\Jetpack::deactivate_module( $this->jetpack_module_slug );
		}

		$this->add_sync_from_jetpack_action();

		return $new_value;
	}

	/**
	 * The compatibility layer uses Jetpack as the single source of truth for shared modules.
	 * As a fallback, Boost still keeps track of the value in the database,
	 * This ensures that the value is still present when Jetpack is deactivated.
	 *
	 * This filter is going to track changes to the modules shared between Jetpack and Boost
	 * and make sure that both plugins are in in sync.
	 * Example: image_cdn
	 */
	public function sync_from_jetpack() {
		$this->remove_sync_to_jetpack_action();
		update_option( "jetpack_boost_status_{$this->boost_module_slug}", \Jetpack::is_module_active( $this->jetpack_module_slug ) );
		$this->add_sync_to_jetpack_action();
	}

	/**
	 * Sync the status to Boost when interacting with the Jetpack dashboard.
	 */
	public function add_sync_from_jetpack_action() {
		add_action( "jetpack_deactivate_module_{$this->jetpack_module_slug}", array( $this, 'sync_from_jetpack' ), 10, 2 );
		add_action( "jetpack_activate_module_{$this->jetpack_module_slug}", array( $this, 'sync_from_jetpack' ), 10, 2 );
	}

	public function remove_sync_from_jetpack_action() {
		remove_action( "jetpack_deactivate_module_{$this->jetpack_module_slug}", array( $this, 'sync_from_jetpack' ), 10 );
		remove_action( "jetpack_activate_module_{$this->jetpack_module_slug}", array( $this, 'sync_from_jetpack' ), 10 );
	}

	/**
	 * Sync the status to Jetpack when interacting with the Boost dashboard
	 */
	public function add_sync_to_jetpack_action() {
		add_action( "add_option_jetpack_boost_status_{$this->boost_module_slug}", array( $this, 'sync_to_jetpack' ), 10, 2 );
		add_action( "update_option_jetpack_boost_status_{$this->boost_module_slug}", array( $this, 'sync_to_jetpack' ), 10, 2 );
	}

	public function remove_sync_to_jetpack_action() {
		remove_action( "add_option_jetpack_boost_status_{$this->boost_module_slug}", array( $this, 'sync_to_jetpack' ), 10 );
		remove_action( "update_option_jetpack_boost_status_{$this->boost_module_slug}", array( $this, 'sync_to_jetpack' ), 10 );
	}
}
