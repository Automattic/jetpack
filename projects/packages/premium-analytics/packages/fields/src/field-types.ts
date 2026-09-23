/**
 * External dependencies
 */
import { registerFieldType } from '@wordpress/widget-primitives';
/**
 * Internal dependencies
 */
import { ArrayCheckboxField } from './field-array-checkbox';
import { SelectField } from './field-select';
import { ToggleGroupField } from './field-toggle-group';
import type { FieldTypeDefinition } from '@wordpress/widget-primitives';

/**
 * The field types Premium Analytics registers. A widget attribute references
 * one by `type` and carries data alone: no `Edit` import.
 */
export const FIELD_TYPES: readonly FieldTypeDefinition[] = [
	{ name: 'jpa/select', baseType: 'text', Edit: SelectField },
	{ name: 'jpa/toggle-group', baseType: 'text', Edit: ToggleGroupField },
	{ name: 'jpa/array-checkbox', baseType: 'array', Edit: ArrayCheckboxField },
];

/**
 * Registers every field type. Upstream keeps the first registration, so calling
 * this again is harmless.
 */
export function registerFieldTypes(): void {
	FIELD_TYPES.forEach( fieldType => registerFieldType( fieldType ) );
}

type ResolvableAttribute = { type?: string };

/**
 * Resolves attributes that reference a registered field type into plain
 * DataViews fields, as `useWidgetTypes` does. For surfaces that bypass that
 * hook (Storybook, tests) while widget-primitives keeps its resolver private.
 *
 * @param attributes - The attributes a widget module declares.
 * @return The attributes with each known `type` replaced by its definition.
 */
export function resolveFieldTypes< Attribute extends ResolvableAttribute >(
	attributes: Attribute[]
): Attribute[] {
	return attributes.map( attribute => {
		const fieldType = FIELD_TYPES.find( candidate => candidate.name === attribute.type );
		if ( ! fieldType ) {
			return attribute;
		}

		const defaults: Partial< FieldTypeDefinition > = { ...fieldType };
		delete defaults.name;
		delete defaults.baseType;

		return { ...defaults, ...attribute, type: fieldType.baseType } as Attribute;
	} );
}
