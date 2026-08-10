import { __ } from '@wordpress/i18n';
import FieldValueControl from './field-value/edit.jsx';

/**
 * Registry of condition types offered by the "+" menu.
 *
 * Phase 1 registers only Field Value. Static condition types — query string, user role, date
 * and time — are deliberately absent: they are decided once at render, but a submission does
 * not carry the request context that produced it, so PHP cannot re-derive them at submit time
 * without a signed render-time payload. Adding one here is the only change the panel needs.
 *
 * Each entry:
 * - slug:         key under `conditionalLogic.controls`
 * - label:        shown in the "+" menu and as the section heading
 * - defaultValue: config stored when the control is switched on
 * - Edit:         component rendering the control's body
 */
export const CONTROLS = [
	{
		slug: 'fieldValue',
		label: __( 'Field value', 'jetpack-forms' ),
		defaultValue: { rules: [] },
		Edit: FieldValueControl,
	},
];

/**
 * Look up a control definition by slug.
 *
 * @param {string} slug - The control slug.
 * @return {object|undefined} The control definition.
 */
export const getControl = slug => CONTROLS.find( control => control.slug === slug );
