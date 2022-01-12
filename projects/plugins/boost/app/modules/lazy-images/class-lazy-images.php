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
 *
 * @TODO: Losing consistency between Jetpack and Jetpack Boost module state at the moment.
 * Going to fix that before submitting for review.
 */
class Lazy_Images extends Module {

	const MODULE_SLUG = 'lazy-images';

	public function is_enabled() {
		if ( class_exists( 'Jetpack' ) ) {
			return Jetpack::is_module_active( self::MODULE_SLUG );
		}
		return parent::is_enabled();
	}

	public function enable() {
		if ( ! class_exists( 'Jetpack' ) ) {
			return parent::enable();
		}
		if ( Jetpack::activate_module( self::MODULE_SLUG, false, false ) ) {
			$this->track_module_status( true );
		}

	}

	public function disable() {
		if ( ! class_exists( 'Jetpack' ) ) {
			return parent::disable();
		}

		if ( Jetpack::deactivate_module( self::MODULE_SLUG ) ) {
			$this->track_module_status( false );
		}
	}


	protected function on_initialize() {
		if ( ! class_exists( 'Jetpack' ) && $this->is_enabled() ) {
			add_action( 'wp', array( Jetpack_Lazy_Images::class, 'instance' ) );
		}
	}
}
