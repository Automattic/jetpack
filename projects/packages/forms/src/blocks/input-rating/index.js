import { __ } from '@wordpress/i18n';
import { DEFAULT_GLYPHS } from './constants';
import edit from './edit';
import './style.scss';

const name = 'rating-input';

const glyphs = DEFAULT_GLYPHS;

const stylesArray = Object.entries( glyphs ).map( ( [ key, { label } ] ) => ( {
	name: key,
	label,
	isDefault: key === 'stars',
} ) );

const settings = {
	apiVersion: 3,
	title: __( 'Rating input', 'jetpack-forms' ),
	description: __( 'Interactive star rating row.', 'jetpack-forms' ),
	parent: [ 'jetpack/field-rating' ],
	category: 'contact-form',
	icon: 'star-filled',
	attributes: {
		max: { type: 'number', default: 5 },
		default: { type: 'number', default: 0 },
	},
	supports: {
		reusable: false,
		html: false,
		color: {
			text: true,
			background: false,
		},
		typography: {
			fontSize: true,
			__experimentalDefaultControls: {
				fontSize: true,
			},
		},
	},
	styles: stylesArray,

	edit,
	save: () => null,
};

export default { name, settings };
