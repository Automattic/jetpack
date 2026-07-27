<?php
/**
 * Widget type support shared by the registry and default layouts.
 *
 * Persisted layouts are left unchanged so missing types remain as removable
 * ghost widgets. Temporary restrictions belong in the runtime types filter.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Status\Host;

/**
 * Returns the current widget support context.
 *
 * @return array{is_wpcom_simple:bool} Widget support context.
 */
function get_widget_support_context() {
	return array(
		'is_wpcom_simple' => ( new Host() )->is_wpcom_simple(),
	);
}

/**
 * Returns unsupported widget types for a context.
 *
 * @param array{is_wpcom_simple:bool} $context Widget support context.
 * @return string[] Unsupported widget type names.
 */
function get_unsupported_widget_types( $context ) {
	$unsupported = array();

	// File download tracking is served only on WPCOM Simple. Calypso applies
	// the same boundary, which excludes self-hosted Jetpack and Atomic sites.
	if ( ! $context['is_wpcom_simple'] ) {
		$unsupported[] = 'jpa/file-downloads';
	}

	return $unsupported;
}

/**
 * Removes unsupported widget records.
 *
 * @param array                       $items    Widget records.
 * @param string                      $type_key Record key containing the widget type.
 * @param array{is_wpcom_simple:bool} $context  Widget support context.
 * @return array Filtered and re-indexed widget records.
 */
function remove_unsupported_widget_items( $items, $type_key, $context ) {
	$unsupported = get_unsupported_widget_types( $context );

	if ( empty( $unsupported ) ) {
		return $items;
	}

	return array_values(
		array_filter(
			$items,
			static function ( $item ) use ( $type_key, $unsupported ) {
				return ! is_array( $item )
					|| ! in_array( $item[ $type_key ] ?? '', $unsupported, true );
			}
		)
	);
}
