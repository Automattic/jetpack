import { Path } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import renderMaterialIcon from '../shared/components/render-material-icon.js';
import { RATING_ICONS } from './rating-icons.js';

/**
 * Rating icon Path component for block variation icons.
 *
 * @param {object} props           - Component props.
 * @param {string} props.iconStyle - The icon style ('stars' or 'hearts').
 * @return {import('react').ReactElement} Path component with the icon.
 */
function RatingIconPath( { iconStyle } ) {
	const d = RATING_ICONS[ iconStyle ] || RATING_ICONS.stars;
	return <Path d={ d } fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />;
}

const variations = [
	{
		name: 'stars',
		title: __( 'Stars rating field', 'jetpack-forms' ),
		description: __( 'Rating field with star icons.', 'jetpack-forms' ),
		icon: {
			src: renderMaterialIcon( <RatingIconPath iconStyle="stars" /> ),
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
			src: renderMaterialIcon( <RatingIconPath iconStyle="hearts" /> ),
		},
		attributes: { iconStyle: 'hearts' },
		isActive: [ 'iconStyle' ],
		scope: [ 'inserter', 'transform' ],
		isDefault: false,
	},
];

export default variations;
