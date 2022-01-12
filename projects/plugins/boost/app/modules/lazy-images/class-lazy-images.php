<?php

namespace Automattic\Jetpack_Boost\Modules\Lazy_Images;

use Automattic\Jetpack\Jetpack_Lazy_Images;
use Automattic\Jetpack_Boost\Modules\Module;
use Jetpack;

class Lazy_Images extends Module {

	const MODULE_SLUG = 'lazy-images';

	public function is_enabled() {
		if ( class_exists( 'Jetpack' ) ) {
			return Jetpack::is_module_active( self::MODULE_SLUG );
		}
		return parent::is_enabled();
	}

	public function enable() {
		if ( class_exists( 'Jetpack' ) ) {
			Jetpack::activate_module( self::MODULE_SLUG, false, false );
		}
		return parent::enable();
	}

	public function disable() {
		if ( class_exists( 'Jetpack' ) ) {
			Jetpack::deactivate_module( self::MODULE_SLUG );
		}
		return parent::disable();
	}


	protected function on_initialize() {
		if ( ! class_exists( 'Jetpack' ) && $this->is_enabled() ) {
			add_action( 'wp', array( Jetpack_Lazy_Images::class, 'instance' ) );
		}
	}
}
