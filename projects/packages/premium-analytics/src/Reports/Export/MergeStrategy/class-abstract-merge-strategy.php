<?php
/**
 * Abstract Merge Strategy
 *
 * Base class providing shared helper methods for merge strategies.
 *
 * @package Automattic\Jetpack\PremiumAnalytics\Reports\Export\MergeStrategy
 */

declare( strict_types=1 );

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export\MergeStrategy;

defined( 'ABSPATH' ) || exit;

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Csv_Report_Controller_Interface;

/**
 * Abstract base class for merge strategies.
 *
 * Provides shared helper methods for creating empty items and getting default values.
 *
 * @since $$next-version$$
 */
abstract class Abstract_Merge_Strategy implements Merge_Strategy_Interface {

	/**
	 * Create an empty item with default values based on a template.
	 *
	 * @param array                                $template_item The template item to use for structure.
	 * @param Csv_Report_Controller_Interface|null $controller    Optional controller for default values.
	 * @return array An array with the same keys but default values.
	 */
	protected function create_empty_item( array $template_item, ?Csv_Report_Controller_Interface $controller = null ): array {
		$empty = array();
		foreach ( array_keys( $template_item ) as $key ) {
			$empty[ $key ] = $this->get_default_value_for_field( $key, $controller );
		}
		return $empty;
	}

	/**
	 * Get the default value for a field based on its type/name.
	 *
	 * @param string                               $field_name The field name.
	 * @param Csv_Report_Controller_Interface|null $controller Optional controller for default values.
	 * @return mixed The default value for the field.
	 */
	protected function get_default_value_for_field( string $field_name, ?Csv_Report_Controller_Interface $controller = null ) {
		// Use controller-specific defaults if available.
		if ( $controller ) {
			$defaults = $controller->get_default_values();
			if ( isset( $defaults[ $field_name ] ) ) {
				return $defaults[ $field_name ];
			}
		}

		// Default to empty string for any unknown fields.
		return '';
	}
}
