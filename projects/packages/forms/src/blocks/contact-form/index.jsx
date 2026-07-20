import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { select } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { __, _x } from '@wordpress/i18n';
import './editor.scss';
import { FORM_POST_TYPE } from '../shared/util/constants.js';
import defaultAttributes from './attributes.ts';
import blockMetadata from './block.json';
import deprecated from './deprecated.jsx';
import edit from './edit.tsx';
import { icon } from './icon.jsx';
import transforms from './transforms.js';
import { DEFAULT_FORM_LABEL, extractTitleText, formatFormLabel } from './util/form-label.js';
import variations from './variations.jsx';

export const name = 'contact-form';

/**
 * Get the label for a form block in List View.
 *
 * For synced forms (with ref), displays the form title with status indicator.
 * For inline forms (without ref), displays the default "Form" label.
 *
 * @param {object} props     - Block attributes
 * @param {number} props.ref - The form post ID (for synced forms)
 * @return {string} The label to display in List View
 */
export const getFormLabel = ( { ref } ) => {
	if ( ! ref ) {
		return DEFAULT_FORM_LABEL;
	}

	const form = select( coreStore ).getEditedEntityRecord( 'postType', FORM_POST_TYPE, ref );

	if ( ! form?.status ) {
		return DEFAULT_FORM_LABEL;
	}

	const titleText = extractTitleText( form?.title );
	const title = titleText ? decodeEntities( titleText ) : '';

	return formatFormLabel( {
		title,
		status: form.status,
		defaultLabel: DEFAULT_FORM_LABEL,
	} );
};

// Extract only valid block registration properties from block.json
// Exclude file-based properties like editorScript, style, etc.
const { editorScript, style, name: blockName, $schema, ...validBlockMetadata } = blockMetadata;

export const settings = {
	// Import valid metadata from block.json to ensure consistency
	...validBlockMetadata,
	// Override/extend with JS-specific settings
	title: __( 'Form', 'jetpack-forms' ),
	description: __(
		'Create forms to collect data from site visitors and manage their responses.',
		'jetpack-forms'
	),
	icon: { src: icon },
	keywords: [
		_x( 'email', 'block search term', 'jetpack-forms' ),
		_x( 'feedback', 'block search term', 'jetpack-forms' ),
		_x( 'contact form', 'block search term', 'jetpack-forms' ),
	],
	attributes: defaultAttributes,
	providesContext: {
		'jetpack/form-class-name': 'className',
	},
	edit,
	save: ( { attributes } ) => {
		// For synced forms (with ref attribute), don't save innerBlocks
		// The actual form content is stored in the jetpack_form post
		if ( attributes.ref ) {
			return null;
		}

		// For inline forms, save the full block with innerBlocks
		const blockProps = useBlockProps.save();
		return (
			<div { ...blockProps }>
				<InnerBlocks.Content />
			</div>
		);
	},
	example: {
		innerBlocks: [
			{
				name: 'jetpack/field-name',
				attributes: { required: true, label: __( 'Name', 'jetpack-forms' ) },
			},
			{
				name: 'jetpack/field-email',
				attributes: { required: true, label: __( 'Email', 'jetpack-forms' ) },
			},
			{
				name: 'jetpack/field-textarea',
				attributes: { label: __( 'Message', 'jetpack-forms' ) },
			},
			{
				name: 'jetpack/button',
				attributes: {
					text: __( 'Contact Us', 'jetpack-forms' ),
					element: 'button',
					lock: { remove: true },
				},
			},
		],
	},
	styles: [
		{ name: 'default', label: __( 'Default', 'jetpack-forms' ), isDefault: true },
		{ name: 'animated', label: __( 'Animated', 'jetpack-forms' ) },
		{ name: 'outlined', label: __( 'Outlined', 'jetpack-forms' ) },
		// Need to figure out some details. Putting on hold for now
		// { name: 'below', label: 'Below' },
	],
	variations,
	category: 'contact-form',
	transforms,
	deprecated,
	// Custom label for List View - shows form title with status for synced forms
	label: getFormLabel,
	__experimentalLabel: getFormLabel, // Backwards compatibility with WP < 7.0
};
