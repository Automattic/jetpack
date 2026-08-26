import { __ } from '@wordpress/i18n';
import { Path, SVG } from '@wordpress/primitives';
import edit from './edit.jsx';
import save from './save.js';

const name = 'option';
const settings = {
	apiVersion: 3,
	title: __( 'Option', 'jetpack-forms' ),
	description: __( 'An option for a form choice field', 'jetpack-forms' ),
	category: 'contact-form',
	icon: {
		src: (
			<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
				<Path d="M5 11.25H19V12.75H5V11.25Z" />
			</SVG>
		),
	},
	parent: [ 'jetpack/field-checkbox', 'jetpack/field-consent', 'jetpack/options' ],
	supports: {
		reusable: false,
		html: false,
		// FORMS-694: choice/option blocks flatten through the field shortcode
		// like inputs — visibility is inert; disable the control.
		visibility: false,
		splitting: true,
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
	},
	merge: ( attributes, { label = '' } ) => ( {
		...attributes,
		label: ( attributes.label || '' ) + label,
	} ),
	// `role: 'content'` is what keeps splitting honest. When Enter splits an option
	// (or "Insert before/after" adds a sibling), the editor builds the new block by
	// copying every attribute of the current one EXCEPT those marked as content —
	// the idea being that a new sibling inherits configuration but starts empty.
	// Anything left unmarked here therefore rides along into the new option: without
	// it the new option arrives pre-filled with the previous option's label, and a
	// sibling of the "Other" option becomes a second "Other" option, which the field's
	// own toggle can neither produce nor represent.
	attributes: {
		placeholder: {
			type: 'string',
			default: '',
		},
		label: {
			type: 'string',
			default: '',
			role: 'content',
		},
		requiredText: {
			type: 'string',
			default: '',
		},
		hideInput: {
			type: 'boolean',
			default: false,
		},
		isStandalone: {
			type: 'boolean',
			default: false,
		},
		isOther: {
			type: 'boolean',
			default: false,
			role: 'content',
		},
		otherPlaceholder: {
			type: 'string',
			default: __( 'Please specify…', 'jetpack-forms' ),
			role: 'content',
		},
	},
	usesContext: [
		'jetpack/field-default-value',
		'jetpack/field-options-type',
		'jetpack/field-required',
		'jetpack/field-share-attributes',
	],
	edit,
	save,
	__experimentalLabel: ( { isOther: isOtherOption } ) => {
		const otherLabel = __( 'Option (other)', 'jetpack-forms' );
		const defaultLabel = __( 'Option', 'jetpack-forms' );
		return isOtherOption ? otherLabel : defaultLabel;
	},
};

export default {
	name,
	settings,
};
