<?php

namespace Automattic\Jetpack_Boost\Data_Sync;

use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync;
use Automattic\Jetpack_Boost\Contracts\Has_Setup;

class Data_Sync_Utils implements Has_Setup {
	const NAMESPACE = 'jetpack_boost_ds';

	/**
	 * @var Data_Sync
	 */
	private static $instance;

	public function __construct() {
		self::$instance = Data_Sync::get_instance( self::NAMESPACE );
	}

	public static function get_instance() {
		return self::$instance;
	}

	public function setup() {
		add_action( 'admin_init', array( $this, 'initialize_ds' ) );
	}

	private function initialize_ds() {
		// Ensure that Async Options are passed to the relevant scripts.
		self::$instance->attach_to_plugin( 'jetpack-boost-admin', 'jetpack_page_jetpack-boost' );
	}
}
