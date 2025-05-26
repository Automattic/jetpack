<?php

namespace Automattic\Jetpack_Boost\Modules;

use Automattic\Jetpack\Boost\App\Contracts\Is_Dev_Feature;
use Automattic\Jetpack_Boost\Contracts\Changes_Output_After_Activation;
use Automattic\Jetpack_Boost\Contracts\Changes_Output_On_Activation;
use Automattic\Jetpack_Boost\Contracts\Feature;
use Automattic\Jetpack_Boost\Contracts\Has_Activate;
use Automattic\Jetpack_Boost\Contracts\Has_Deactivate;
use Automattic\Jetpack_Boost\Contracts\Needs_To_Be_Ready;
use Automattic\Jetpack_Boost\Contracts\Optimization;
use Automattic\Jetpack_Boost\Contracts\Sub_Feature;
use Automattic\Jetpack_Boost\Lib\Status;

class Module {
	const DISABLE_MODULE_QUERY_VAR = 'jb-disable-modules';

	/**
	 * @var Status
	 */
	private $status;

	/**
	 * @var Feature
	 */
	public $feature;

	public function __construct( Feature $feature ) {
		$this->feature = $feature;
		$this->status  = new Status( $feature::get_slug() );
	}

	public function on_activate() {
		if ( $this->feature instanceof Changes_Output_On_Activation ) {
			$this->indicate_page_output_changed();
		}

		return $this->feature instanceof Has_Activate ? $this->feature::activate() : true;
	}

	public function on_deactivate() {
		// If the module changes the page output, with or without preparation, deactivating the module should indicate a page output change.
		if ( $this->feature instanceof Changes_Output_On_Activation || $this->feature instanceof Changes_Output_After_Activation ) {
			$this->indicate_page_output_changed();
		}

		return $this->feature instanceof Has_Deactivate ? $this->feature::deactivate() : true;
	}

	public function indicate_page_output_changed() {
		/**
		 * Indicate that the HTML output of front-end has changed.
		 *
		 * If there is any page cache, it should be invalidated when this action is triggered.
		 */
		do_action( 'jetpack_boost_page_output_changed' );
	}

	public function get_slug() {
		return $this->feature::get_slug();
	}

	/**
	 * If the module has any submodules, this method will return an array of Module instances for each submodule.
	 */
	public function get_submodules() {
		$subfeatures = Features_Index::get_sub_features_of( $this->feature );

		$modules = array();
		foreach ( $subfeatures as $subfeature ) {
			$modules[ $subfeature::get_slug() ] = new Module( new $subfeature() );
		}

		return $modules;
	}

	public function get_available_submodules() {
		$submodules = $this->get_submodules();
		if ( empty( $submodules ) ) {
			return array();
		}

		$available_submodules = array();
		foreach ( $submodules as $slug => $submodule ) {
			if ( $submodule->is_available() && ! $this->is_disabled_dev_feature( $submodule->feature ) ) {
				$available_submodules[ $slug ] = $submodule;
			}
		}

		return $available_submodules;
	}

	/**
	 * Check if the feature is disabled in development.
	 *
	 * Returns true if the feature is a dev feature and the dev features should be disabled.
	 *
	 * @param Feature $feature The feature to check.
	 * @return bool True if the feature is available, false otherwise.
	 */
	private function is_disabled_dev_feature( $feature ) {
		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized,WordPress.Security.ValidatedSanitizedInput.MissingUnslash
		$is_disabled_dev_feature = false === strpos( $_SERVER['HTTP_HOST'] ?? '', 'jurassic.ninja' );
		if ( defined( 'JETPACK_BOOST_DEVELOPMENT_FEATURES' ) ) {
			$is_disabled_dev_feature = ! JETPACK_BOOST_DEVELOPMENT_FEATURES;
		}

		if ( $feature instanceof Is_Dev_Feature ) {
			return $is_disabled_dev_feature;
		}

		return false;
	}

	/**
	 * Get the active parent modules.
	 *
	 * @return Module[] The active parent modules.
	 */
	public function get_active_parent_modules() {
		if ( ! $this->feature instanceof Sub_Feature ) {
			return array();
		}

		$parent_features = $this->feature->get_parent_features();
		$modules         = array();
		foreach ( $parent_features as $parent_feature ) {
			$parent_module = new Module( new $parent_feature() );
			if ( $parent_module->is_enabled() ) {
				$modules[ $parent_module->get_slug() ] = $parent_module;
			}
		}

		return $modules;
	}

	public function update( $new_status ) {
		return $this->status->set( $new_status );
	}

	/**
	 * Check if the module is enabled.
	 *
	 * If the module is always on, it is enabled. Otherwise, check database for the module status.
	 * If it's a submodule, the status is only about the submodule itself, not its parent modules.
	 *
	 * @return bool True if the module is enabled, false otherwise.
	 */
	public function is_enabled() {
		$always_on = is_subclass_of( $this->feature, 'Automattic\Jetpack_Boost\Contracts\Is_Always_On' );
		if ( $always_on ) {
			return true;
		}

		return $this->status->get();
	}

	/**
	 * Check if the module is available.
	 *
	 * If the module is not available, it cannot be enabled.
	 */
	public function is_available() {
		if ( ! $this->feature::is_available() || $this->is_disabled_dev_feature( $this->feature ) || $this->is_force_disabled() ) {
			return false;
		}

		// If the module is not a sub-module, and it already passed the availability check, it is available.
		if ( ! $this->feature instanceof Sub_Feature ) {
			return true;
		}

		// If the module is a sub-module, it is available if at least one of its parent modules is available.
		foreach ( $this->feature::get_parent_features() as $parent_feature ) {
			if ( ( new Module( new $parent_feature() ) )->is_available() ) {
				return true;
			}
		}

		return false;
	}

	private function is_force_disabled() {
		$slug = $this->feature::get_slug();

		// phpcs:disable WordPress.Security.NonceVerification.Recommended
		if ( ! empty( $_GET[ self::DISABLE_MODULE_QUERY_VAR ] ) ) {
			// phpcs:disable WordPress.Security.NonceVerification.Recommended
			// phpcs:disable WordPress.Security.ValidatedSanitizedInput.MissingUnslash
			// phpcs:disable WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			$disabled_modules = array_map( 'sanitize_key', explode( ',', $_GET[ self::DISABLE_MODULE_QUERY_VAR ] ) );
			return in_array( $slug, $disabled_modules, true ) || in_array( 'all', $disabled_modules, true );
		}

		return false;
	}

	/**
	 * Check if the module is active and ready to serve optimized output.
	 */
	public function is_optimizing() {
		if ( ! $this->is_available() ) {
			return false;
		}

		if ( ! ( $this->feature instanceof Optimization ) || ! $this->is_enabled() ) {
			return false;
		}

		if ( $this->feature instanceof Needs_To_Be_Ready && ! $this->feature->is_ready() ) {
			return false;
		}

		if ( $this->feature instanceof Sub_Feature ) {
			$parent_modules = $this->get_active_parent_modules();
			if ( empty( $parent_modules ) ) {
				return false;
			}
		}

		return true;
	}
}
