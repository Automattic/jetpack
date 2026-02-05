import { Path } from '@wordpress/components';
import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import renderMaterialIcon from '../shared/components/render-material-icon.jsx';
import edit from './edit.js';
import save from './save.js';

/**
 * Core parent blocks for the label block.
 * Do not include 'jetpack/field-file' since it prevents the label from being duplicated.
 */
const coreParentBlocks = [
	'jetpack/field-date',
	'jetpack/field-email',
	'jetpack/field-multiple-choice',
	'jetpack/field-name',
	'jetpack/field-number',
	'jetpack/field-rating',
	'jetpack/field-select',
	'jetpack/field-single-choice',
	'jetpack/field-telephone',
	'jetpack/field-text',
	'jetpack/field-textarea',
	'jetpack/field-time',
	'jetpack/field-image-select',
	'jetpack/field-slider',
];

/**
 * Filter to allow custom field blocks to be valid parents for the label block.
 *
 * External developers can use this filter to register their custom field block
 * as a valid parent for the jetpack/label block.
 *
 * @param {string[]} parentBlocks - Array of parent block names.
 *
 * @example
 * import { addFilter } from '@wordpress/hooks';
 *
 * addFilter(
 *     'jetpack.forms.label.parentBlocks',
 *     'my-plugin/color-field',
 *     (parents) => [...parents, 'jetpack/field-color']
 * );
 */
const parentBlocks = applyFilters( 'jetpack.forms.label.parentBlocks', coreParentBlocks );

const name = 'label';
const settings = {
	apiVersion: 3,
	title: __( 'Label', 'jetpack-forms' ),
	description: __( 'A label for a form field', 'jetpack-forms' ),
	category: 'contact-form',
	icon: {
		src: renderMaterialIcon(
			<Path d="M12.9 6H10.9L6.90002 17H8.80002L9.90002 14H14.1L15.2 17H17.1L12.9 6ZM10.4 12.5L11.9 7.6L13.6 12.5H10.4Z" />
		),
	},
	parent: parentBlocks,
	supports: {
		reusable: false,
		html: false,
		color: {
			text: true,
			background: false,
			gradients: false,
		},
		typography: {
			fontSize: true,
			lineHeight: true,
			__experimentalFontFamily: true,
			__experimentalFontWeight: true,
			__experimentalFontStyle: true,
			__experimentalTextTransform: true,
			__experimentalTextDecoration: true,
			__experimentalLetterSpacing: true,
			__experimentalDefaultControls: {
				fontSize: true,
			},
		},
		blockVisibility: true,
	},
	attributes: {
		label: {
			type: 'string',
			default: '',
		},
		placeholder: {
			type: 'string',
			default: '',
		},
		requiredText: {
			type: 'string',
			default: '',
		},
		requiredIndicator: {
			type: 'boolean',
			default: true,
		},
		metadata: {
			type: 'object',
			default: {},
		},
	},
	usesContext: [
		'jetpack/form-class-name',
		'jetpack/field-required',
		'jetpack/field-date-format',
		'jetpack/field-share-attributes',
	],
	edit,
	save,
};

export default {
	name,
	settings,
};
