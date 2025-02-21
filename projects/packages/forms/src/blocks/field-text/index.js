import { __ } from '@wordpress/i18n';
import { getIconColor, fieldTextBlockIcon } from '../contact-form/util/block-icons';
import transforms from '../contact-form/util/field-transforms';
import edit from './edit';

export const name = 'field-text';

export const settings = {
	apiVersion: 3,
	title: __( 'Text Input Field', 'jetpack-forms' ),
	description: __( 'Collect short text responses from site visitors.', 'jetpack-forms' ),
	category: 'contact-form',
	icon: {
		foreground: getIconColor(),
		src: fieldTextBlockIcon,
	},
	supports: {
		reusable: false,
		html: false,
	},
	transforms,
	edit,
	save: () => null,
	example: {},
	attributes: {
		id: {
			type: 'string',
			default: '',
		},
		label: {
			type: 'string',
			default: __( 'Text', 'jetpack-forms' ),
			role: 'content',
		},
		required: {
			type: 'boolean',
			default: false,
		},
		requiredText: {
			type: 'string',
			role: 'content',
		},
		options: {
			type: 'array',
			default: [],
			role: 'content',
		},
		defaultValue: {
			type: 'string',
			default: '',
			role: 'content',
		},
		placeholder: {
			type: 'string',
			default: '',
			role: 'content',
		},
		width: {
			type: 'number',
			default: 100,
		},
		borderRadius: {
			type: 'number',
			default: '',
		},
		borderWidth: {
			type: 'number',
			default: '',
		},
		labelFontSize: {
			type: 'string',
		},
		fieldFontSize: {
			type: 'string',
		},
		lineHeight: {
			type: 'number',
		},
		labelLineHeight: {
			type: 'number',
		},
		inputColor: {
			type: 'string',
		},
		labelColor: {
			type: 'string',
		},
		fieldBackgroundColor: {
			type: 'string',
		},
		buttonBackgroundColor: {
			type: 'string',
		},
		buttonBorderRadius: {
			type: 'number',
			default: '',
		},
		buttonBorderWidth: {
			type: 'number',
			default: '',
		},
		borderColor: {
			type: 'string',
		},
		shareFieldAttributes: {
			type: 'boolean',
			default: true,
		},
	},
};
