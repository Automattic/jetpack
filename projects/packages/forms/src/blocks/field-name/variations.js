import { __ } from '@wordpress/i18n';
import blockIcon from './icon.jsx';

const icon = blockIcon;

export const FIRST_NAME_ID = 'first-name';
export const LAST_NAME_ID = 'last-name';
export const NAME_ID = 'name';

export const DEFAULT_FIRST_NAME_LABEL = __( 'First name', 'jetpack-forms' );
export const DEFAULT_LAST_NAME_LABEL = __( 'Last name', 'jetpack-forms' );
export const DEFAULT_NAME_LABEL = __( 'Name', 'jetpack-forms' );

// Variation ids can have suffixed forms like first-name-2 to avoid duplicates.
export const isFirstNameVariationId = id =>
	typeof id === 'string' && /^first-name(?:-\d+)?$/.test( id );
export const isLastNameVariationId = id =>
	typeof id === 'string' && /^last-name(?:-\d+)?$/.test( id );
export const isNameVariationId = id => typeof id === 'string' && /^name(?:-\d+)?$/.test( id );

const variations = [
	{
		name: NAME_ID,
		title: DEFAULT_NAME_LABEL,
		description: __( 'Collect the site visitor’s name.', 'jetpack-forms' ),
		icon,
		scope: [ 'transform' ],
		isActive: blockAttributes => blockAttributes.fieldVariant === NAME_ID,
		attributes: {
			id: '',
			fieldVariant: NAME_ID,
		},
		innerBlocks: [
			[ 'jetpack/label', { label: DEFAULT_NAME_LABEL } ],
			[ 'jetpack/input', { type: 'text' } ],
		],
	},
	{
		name: FIRST_NAME_ID,
		title: DEFAULT_FIRST_NAME_LABEL,
		description: __( 'Collect the visitor’s first name.', 'jetpack-forms' ),
		icon,
		scope: [ 'inserter', 'transform' ],
		isActive: blockAttributes => blockAttributes.fieldVariant === FIRST_NAME_ID,
		attributes: {
			id: FIRST_NAME_ID,
			fieldVariant: FIRST_NAME_ID,
		},
		innerBlocks: [
			[ 'jetpack/label', { label: DEFAULT_FIRST_NAME_LABEL } ],
			[ 'jetpack/input', { type: 'text' } ],
		],
		example: {
			innerBlocks: [
				{
					name: 'jetpack/label',
					attributes: {
						label: DEFAULT_FIRST_NAME_LABEL,
					},
				},
				{
					name: 'jetpack/input',
					attributes: {
						type: 'text',
					},
				},
			],
		},
	},
	{
		name: LAST_NAME_ID,
		title: DEFAULT_LAST_NAME_LABEL,
		description: __( 'Collect the visitor’s last name.', 'jetpack-forms' ),
		icon,
		scope: [ 'inserter', 'transform' ],
		isActive: blockAttributes => blockAttributes.fieldVariant === LAST_NAME_ID,
		attributes: {
			id: LAST_NAME_ID,
			fieldVariant: LAST_NAME_ID,
		},
		innerBlocks: [
			[ 'jetpack/label', { label: DEFAULT_LAST_NAME_LABEL } ],
			[ 'jetpack/input', { type: 'text' } ],
		],
		example: {
			innerBlocks: [
				{
					name: 'jetpack/label',
					attributes: {
						label: DEFAULT_LAST_NAME_LABEL,
					},
				},
				{
					name: 'jetpack/input',
					attributes: {
						type: 'text',
					},
				},
			],
		},
	},
];

export default variations;
