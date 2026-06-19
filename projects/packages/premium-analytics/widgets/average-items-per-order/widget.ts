/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { chartBar } from '@wordpress/icons';

/**
 * Widget type definition.
 *
 * Metadata ported from PR #49505 (`jpa/average-items-per-order`). The render
 * here is a self-contained stand-in: the production widget composes the
 * analytics widgets-toolkit (orders report + chart), which is not part of this
 * core-packages testing branch.
 */
export default {
	name: 'jpa/average-items-per-order',
	title: __( 'Average items per order', 'jetpack-premium-analytics' ),
	description: __(
		'Show the average number of products per order over a set period of time.',
		'jetpack-premium-analytics'
	),
	icon: chartBar,
};
