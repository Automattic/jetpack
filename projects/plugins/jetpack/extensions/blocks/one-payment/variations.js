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
	},
	{
		name: 'flibble',
		title: 'Add a payments block',
		attributes: {
			className: 'bar',
		},
		innerBlocks: [ [ 'jetpack/recurring-payments', {} ] ],
	},
];

export default variations;
