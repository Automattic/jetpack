/**
 * Jetpack Forms Field Extensibility API
 *
 * This module provides the public API for extending Jetpack Forms with custom field types.
 * External developers can use this API to register new form fields that integrate
 * seamlessly with Jetpack Forms, including validation, rendering, and response handling.
 *
 * @example
 * // Import the API in your plugin
 * import {
 *     registerJetpackFormField,
 *     JetpackField,
 *     useFormWrapper,
 * } from '@automattic/jetpack-forms/field-api';
 *
 * // Register a custom color picker field
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
 *
 * @module @automattic/jetpack-forms/field-api
 */

// Field registration
export { registerJetpackFormField, getRegisteredFields } from './register-field.js';

// Validation utilities
export {
	registerFieldValidator,
	validateField,
	validateDate,
	isEmptyValue,
	getCustomValidators,
} from './validation.js';

// Shared components
export {
	JetpackField,
	JetpackFieldControls,
	JetpackFieldWidth,
	JetpackFieldId,
	ToolbarRequiredGroup,
	defaultSettings,
	useFormWrapper,
	useFieldSelected,
	useJetpackFieldStyles,
	useFormStyle,
	useSyncRequiredIndicator,
	useParentFormClientId,
	generateUniqueFormFieldId,
	FORM_BLOCK_NAME,
	ALLOWED_INNER_BLOCKS,
} from './components.js';
