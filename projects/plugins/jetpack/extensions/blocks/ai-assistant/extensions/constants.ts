// All Jetpack Form blocks to extend
export const JETPACK_FORM_CHILDREN_BLOCKS = [
	'jetpack/field-name',
	'jetpack/field-number',
	'jetpack/field-email',
	'jetpack/field-text',
	'jetpack/field-textarea',
	'jetpack/field-checkbox',
	'jetpack/field-date',
	'jetpack/field-telephone',
	'jetpack/field-url',
	'jetpack/field-checkbox-multiple',
	'jetpack/field-radio',
	'jetpack/field-select',
	'jetpack/field-consent',
	'jetpack/button',
] as const;

export const EXTENDED_BLOCKS = [
	'core/heading',
	'core/paragraph',
	'core/list-item',
	'core/list',
	'jetpack/contact-form',
	...JETPACK_FORM_CHILDREN_BLOCKS,
];

export type ExtendedBlockProp =
	| 'core/heading'
	| 'core/paragraph'
	| 'core/list-item'
	| 'core/list'
	| 'jetpack/contact-form'
	| ( typeof JETPACK_FORM_CHILDREN_BLOCKS )[ number ];
