<?php

namespace Automattic\Jetpack_Boost\Modules;

use Automattic\Jetpack_Boost\Contracts\Feature;
use Automattic\Jetpack_Boost\Lib\State;
use Automattic\Jetpack_Boost\REST_API\Contracts\Has_Endpoints;
use Automattic\Jetpack_Boost\REST_API\REST_API;

class Optimization {
	/**
	 * @var State
	 */
	protected $state;

	/**
	 * @var Feature
	 */
	protected $feature;

	/**
	 * @param Feature $module
	 */
	public function __construct( Feature $feature ) {
		$this->feature = $feature;
		$this->state   = new State( $feature->get_slug() );
	}

	public function register_endpoints() {
		if ( ! $this->feature instanceof Has_Endpoints ) {
			return false;
		}

		if ( empty( $this->feature->get_endpoints() ) ) {
			return false;
		}
		
		REST_API::register( $this->feature->get_endpoints() );

	}


	/**
	 * When a module is enabled,
	 * It may need to be initialized to perform various once-in a request lifecycle actions,
	 * like attach hooks
	 */
	public function initialize() {
		if ( ! $this->state->is_enabled() ) {
			return false;
		}

		$this->feature->initialize();
		do_action( "jetpack_boost_{$this->feature->get_slug()}_initialized", $this );

		return true;
	}

	public function get_slug() {
		return $this->feature->get_slug();
	}


	public function is_enabled() {
		return $this->state->is_enabled();
	}

	public function enable() {
		$this->state->enable();
	}

	public function disable() {
		$this->state->disable();
	}


}