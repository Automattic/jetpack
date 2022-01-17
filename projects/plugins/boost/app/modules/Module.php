<?php

namespace Automattic\Jetpack_Boost\Modules;

use Automattic\Jetpack_Boost\REST_API\Contracts\Has_Endpoints;
use Automattic\Jetpack_Boost\REST_API\REST_API;

class Module {
	/**
	 * @var Module_Toggle
	 */
	protected $toggle;

	/**
	 * @var Generic_Module
	 */
	protected $module;

	/**
	 * @param Generic_Module $module
	 */
	public function __construct( Generic_Module $module ) {
		$this->module = $module;
		$this->toggle = new Module_Toggle( $module->get_slug() );
	}

	public function register_endpoints() {
		if ( ! $this->module instanceof Has_Endpoints ) {
			return false;
		}

		if ( empty( $this->module->get_endpoints() ) ) {
			return false;
		}

		$rest_api = new REST_API( $this->module->get_endpoints() );
		add_action( 'rest_api_init', array( $rest_api, 'register_rest_routes' ) );

	}


	/**
	 * When a module is enabled,
	 * It may need to be initialized to perform various once-in a request lifecycle actions,
	 * like attach hooks
	 */
	public function initialize() {
		if ( ! $this->toggle->is_enabled() ) {
			return false;
		}

		$this->module->initialize();
		do_action( "jetpack_boost_{$this->module->get_slug()}_initialized", $this );

		return true;
	}

	public function get_slug() {
		return $this->module->get_slug();
	}


	public function is_enabled() {
		return $this->toggle->is_enabled();
	}
	
	public function enable() {
		$this->toggle->enable();
	}

	public function disable() {
		$this->toggle->disable();
	}


}