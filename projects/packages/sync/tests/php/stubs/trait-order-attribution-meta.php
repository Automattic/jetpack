<?php
/**
 * Test stub for WooCommerce's OrderAttributionMeta trait.
 *
 * The WooCommerce_Analytics sync module composes this trait at class-load time,
 * and WooCommerce is a runtime (not composer) dependency, so unit tests need a
 * stand-in to be able to autoload the module class at all. Tests exercising the
 * attribution path itself belong in suites where WooCommerce is loaded.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\WooCommerce\Internal\Traits;

if ( ! trait_exists( OrderAttributionMeta::class, false ) ) {
	/**
	 * Minimal stand-in for WooCommerce's OrderAttributionMeta trait.
	 */
	trait OrderAttributionMeta {

		/**
		 * Attribution field names.
		 *
		 * @var array
		 */
		protected $field_names = array();

		/**
		 * No-op stand-in.
		 *
		 * @return void
		 */
		protected function set_fields_and_prefix() {}

		/**
		 * Pass-through stand-in.
		 *
		 * @param string $field The field name.
		 * @return string
		 */
		protected function get_meta_prefixed_field_name( $field ) {
			return $field;
		}
	}
}
