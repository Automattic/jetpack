import { Path } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import renderMaterialIcon from '../shared/components/render-material-icon.js';

const variations = [
	{
		name: 'stars',
		title: __( 'Stars rating field', 'jetpack-forms' ),
		description: __( 'Rating field with star icons.', 'jetpack-forms' ),
		icon: {
			src: renderMaterialIcon(
				<Path
					d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z"
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
					d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
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
