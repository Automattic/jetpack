import { Path } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import renderMaterialIcon from '../shared/components/render-material-icon.js';

const icon = {
	src: renderMaterialIcon(
		<Path d="M8.25 11.5C9.63071 11.5 10.75 10.3807 10.75 9C10.75 7.61929 9.63071 6.5 8.25 6.5C6.86929 6.5 5.75 7.61929 5.75 9C5.75 10.3807 6.86929 11.5 8.25 11.5ZM8.25 10C8.80228 10 9.25 9.55228 9.25 9C9.25 8.44772 8.80228 8 8.25 8C7.69772 8 7.25 8.44772 7.25 9C7.25 9.55228 7.69772 10 8.25 10ZM13 15.5V17.5H11.5V15.5C11.5 14.8096 10.9404 14.25 10.25 14.25H6.25C5.55964 14.25 5 14.8096 5 15.5V17.5H3.5V15.5C3.5 13.9812 4.73122 12.75 6.25 12.75H10.25C11.7688 12.75 13 13.9812 13 15.5ZM20.5 11H14.5V9.5H20.5V11ZM20.5 14.5H14.5V13H20.5V14.5Z" />
	),
};

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
