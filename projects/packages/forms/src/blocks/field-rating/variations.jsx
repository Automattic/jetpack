import { __ } from '@wordpress/i18n';
import { SVG, Path } from '@wordpress/primitives';
import { RATING_ICONS } from './rating-icons.js';

/**
 * Rating icon for block variation icons.
 *
 * @param {string} iconStyle - The icon style ('stars' or 'hearts').
 * @return {import('react').ReactElement} SVG icon element.
 */
function createRatingIcon( iconStyle ) {
	const d = RATING_ICONS[ iconStyle ] || RATING_ICONS.stars;
	return (
		<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
			<Path d={ d } fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
		</SVG>
	);
}

const variations = [
	{
		name: 'stars',
		title: __( 'Stars rating field', 'jetpack-forms' ),
		description: __( 'Rating field with star icons.', 'jetpack-forms' ),
		icon: {
			src: createRatingIcon( 'stars' ),
		},
		attributes: { iconStyle: 'stars' },
		isActive: [ 'iconStyle' ],
		scope: [ 'inserter', 'transform' ],
		isDefault: true,
	},
	{
		name: 'hearts',
		title: __( 'Hearts rating field', 'jetpack-forms' ),
		description: __( 'Rating field with heart icons.', 'jetpack-forms' ),
		icon: {
			src: createRatingIcon( 'hearts' ),
		},
		attributes: { iconStyle: 'hearts' },
		isActive: [ 'iconStyle' ],
		scope: [ 'inserter', 'transform' ],
		isDefault: false,
	},
];

export default variations;
