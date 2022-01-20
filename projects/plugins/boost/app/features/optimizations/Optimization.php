<?php

namespace Automattic\Jetpack_Boost\Features\Optimizations;

use Automattic\Jetpack_Boost\Contracts\Feature;
use Automattic\Jetpack_Boost\Lib\Status;
use Automattic\Jetpack_Boost\REST_API\Contracts\Has_Endpoints;
use Automattic\Jetpack_Boost\REST_API\REST_API;

class Optimization {
	/**
	 * @var Status
	 */
	protected $status;

	/**
	 * @var Feature
	 */
	protected $feature;

	/**
	 * @param Feature $module
	 */
	public function __construct( Feature $feature ) {
		$this->feature = $feature;
		$this->status  = new Status( $feature->get_slug() );
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
		if ( ! $this->status->is_enabled() ) {
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
		return $this->status->is_enabled();
	}

	public function enable() {
		$this->status->enable();
	}

	public function disable() {
		$this->status->disable();
	}

}
