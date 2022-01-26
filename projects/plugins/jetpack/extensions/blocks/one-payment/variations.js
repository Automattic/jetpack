/**
 * The different payment blocks that can be chosen.
 */

/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

const variations = [
	{
		name: 'piffle',
		title: __( 'Add a donations block', 'jetpack' ),
		attributes: {
			className: 'foo',
		},
		innerBlocks: [ [ 'jetpack/donations', {} ] ],
		// The inner block itself is already listed in the inserter in its own right, so just include in this blocks
		// unified intro.
		scope: [ 'block' ],
	},
	{
		name: 'flibble',
		title: 'Add a payments block',
		attributes: {
			className: 'bar',
		},
		innerBlocks: [ [ 'jetpack/recurring-payments', {} ] ],
		// The inner block itself is already listed in the inserter in its own right, so just include in this blocks
		// unified intro.
		scope: [ 'block' ],
	},
];

export default variations;
