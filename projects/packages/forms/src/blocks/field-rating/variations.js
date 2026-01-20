import { Path } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { RATING_ICONS } from '../../shared/rating-icons.js';
import renderMaterialIcon from '../shared/components/render-material-icon.js';

const variations = [
	{
		name: 'stars',
		title: __( 'Stars rating field', 'jetpack-forms' ),
		description: __( 'Rating field with star icons.', 'jetpack-forms' ),
		icon: {
			src: renderMaterialIcon(
				<Path
					d={ RATING_ICONS.stars }
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinejoin="round"
				/>
			),
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
			src: renderMaterialIcon(
				<Path
					d={ RATING_ICONS.hearts }
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinejoin="round"
				/>
			),
		},
		attributes: { iconStyle: 'hearts' },
		isActive: [ 'iconStyle' ],
		scope: [ 'inserter', 'transform' ],
		isDefault: false,
	},
];

export default variations;
