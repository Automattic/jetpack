<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Speculation_Rules\Data_Sync;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Set;
use Automattic\Jetpack_Boost\Lib\Excludes_URLs_Utils;

/**
 * Class to handle Speculation Rules data entry
 *
 * @since $$next-version$$
 */
class Speculation_Rules_Excludes_Entry implements Entry_Can_Get, Entry_Can_Set {

	/**
	 * The option key used to store the Speculation Rules Excludes option.
	 *
	 * @var string
	 */
	private $option_key;

	/**
	 * Constructs a new instance of the Speculation_Rules_Excludes_Entry class.
	 */
	public function __construct() {
		$this->option_key = 'jetpack_boost_ds_speculation_rules_excludes';
	}

	/**
	 * Get the list of URL patterns to exclude
	 *
	 * @return array List of URL patterns
	 */
	public function get( $fallback_value = false ) {
		if ( $fallback_value !== false ) {
			return get_option( $this->option_key, $fallback_value );
		}
		return get_option( $this->option_key );
	}

	/**
	 * Set the list of URL patterns to exclude
	 *
	 * @param array $settings List of settings.
	 * @return void
	 */
	public function set( $settings ) {
		$settings['bypass_patterns'] = Excludes_URLs_Utils::sanitize_value( $settings['bypass_patterns'], array( 'wildcards' => false ) );
		update_option(
			$this->option_key,
			(array) apply_filters(
				'jetpack_boost_speculation_rules_excludes',
				$settings
			)
		);
	}
}
