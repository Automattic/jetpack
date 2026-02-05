/**
 * Field registration API for Jetpack Forms extensibility.
 *
 * This module provides the main API for registering custom form fields.
 * External developers can use registerJetpackFormField() to add new field types
 * that integrate seamlessly with Jetpack Forms.
 */

import { registerBlockType } from '@wordpress/blocks';
import { defaultSettings } from './components.js';
import { registerFieldValidator } from './validation.js';

/**
 * Registry of all registered custom fields.
 *
 * @type {Array<{name: string, blockName: string, fieldType: string}>}
 */
const registeredFields = [];

/**
 * Default attributes that all Jetpack form fields share.
 *
 * @type {object}
 */
const defaultFieldAttributes = {
	label: {
		type: 'string',
		default: '',
	},
	required: {
		type: 'boolean',
		default: false,
	},
	requiredText: {
		type: 'string',
		default: '',
	},
	requiredIndicator: {
		type: 'boolean',
		default: true,
	},
	placeholder: {
		type: 'string',
		default: '',
	},
	width: {
		enum: [ 25, 33, 50, 75, 100, 'auto' ],
		default: 100,
	},
	id: {
		type: 'string',
	},
	shareFieldAttributes: {
		type: 'boolean',
		default: true,
	},
};

/**
 * Register a custom Jetpack Form field.
 *
 * This function registers a new block type that will appear as a field option
 * in the Jetpack Forms editor, and optionally registers frontend validation.
 *
 * @param {object}        config                       - Configuration object for the custom field.
 * @param {string}        config.name                  - Block name without 'jetpack/' prefix (e.g., 'field-color').
 * @param {string}        config.title                 - Human-readable field title (e.g., 'Color Picker').
 * @param {string|object} config.icon                  - Block icon (dashicon name or SVG element).
 * @param {Function}      config.edit                  - Edit component for the block editor.
 * @param {Function}      [config.save]                - Save function (defaults to returning null for dynamic blocks).
 * @param {string}        [config.description]         - Field description shown in the inserter.
 * @param {object}        [config.attributes]          - Additional block attributes beyond the defaults.
 * @param {object}        [config.validation]          - Validation configuration.
 * @param {Function}      [config.validation.frontend] - Frontend validator: (value, isRequired, extra) => 'yes' | errorKey
 * @param {string}        [config.phpType]             - The PHP field type (defaults to name without 'field-' prefix).
 * @param {object}        [config.supports]            - Block supports configuration.
 * @param {boolean}       [config.isPrivate]           - If true, block won't appear in inserter (for internal use).
 * @return {object|undefined} The registered block type, or undefined if registration failed.
 *
 * @example
 * // Register a simple color picker field
 * registerJetpackFormField({
 *     name: 'field-color',
 *     title: 'Color Picker',
 *     icon: 'color-picker',
 *     edit: ColorPickerEdit,
 *     validation: {
 *         frontend: (value, isRequired) => {
 *             if (isRequired && !value) return 'is_required';
 *             if (value && !/^#[0-9A-Fa-f]{6}$/.test(value)) return 'invalid_color';
 *             return 'yes';
 *         },
 *     },
 *     phpType: 'color',
 * });
 */
export function registerJetpackFormField( config ) {
	const {
		name,
		title,
		icon,
		edit,
		save = () => null,
		description = '',
		attributes = {},
		validation = null,
		phpType = null,
		supports = {},
		isPrivate = false,
	} = config;

	if ( ! name || ! title || ! edit ) {
		// eslint-disable-next-line no-console
		console.error(
			'Jetpack Forms: registerJetpackFormField requires name, title, and edit properties.'
		);
		return undefined;
	}

	const blockName = name.startsWith( 'jetpack/' ) ? name : `jetpack/${ name }`;
	const fieldType = phpType || name.replace( /^(jetpack\/)?field-/, '' );

	// Merge default attributes with custom attributes
	const mergedAttributes = {
		...defaultFieldAttributes,
		...attributes,
	};

	// Register the block
	const blockConfig = {
		...defaultSettings,
		title,
		icon,
		description,
		category: 'contact-form',
		parent: [ 'jetpack/contact-form' ],
		attributes: mergedAttributes,
		edit,
		save,
		supports: {
			...defaultSettings.supports,
			...supports,
			inserter: ! isPrivate,
		},
	};

	const result = registerBlockType( blockName, blockConfig );

	// Register frontend validation if provided
	if ( validation?.frontend && typeof validation.frontend === 'function' ) {
		registerFieldValidator( fieldType, validation.frontend );
	}

	// Store registration info for later reference
	registeredFields.push( {
		name,
		blockName,
		fieldType,
	} );

	return result;
}

/**
 * Get all registered custom fields.
 *
 * @return {Array<{name: string, blockName: string, fieldType: string}>} List of registered fields.
 */
export function getRegisteredFields() {
	return [ ...registeredFields ];
}

export default registerJetpackFormField;
