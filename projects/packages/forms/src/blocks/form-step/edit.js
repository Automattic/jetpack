import { InnerBlocks, useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import AddStepControls from '../contact-form/components/add-step-controls';
import useParentFormClientId from '../shared/hooks/use-parent-form-client-id';
import useStep from '../shared/hooks/use-step';

const ALLOWED_CORE_BLOCKS = [
	'core/audio',
	'core/columns',
	'core/group',
	'core/heading',
	'core/html',
	'core/image',
	'core/list',
	'core/paragraph',
	'core/row',
	'core/separator',
	'core/spacer',
	'core/stack',
	'core/subhead',
	'core/video',
];

const ALLOWED_FORM_BLOCKS = [
	'jetpack/field-name',
	'jetpack/field-email',
	'jetpack/field-url',
	'jetpack/field-textarea',
	'jetpack/field-checkbox',
	'jetpack/field-checkbox-multiple',
	'jetpack/field-radio',
	'jetpack/field-select',
	'jetpack/field-date',
	'jetpack/field-telephone',
	'jetpack/field-consent',
	'jetpack/field-rating',
	'jetpack/field-multiple-choice',
	'jetpack/field-file',
	'jetpack/field-hidden',
	'jetpack/field-text',
	'jetpack/form-step-navigation',
	...ALLOWED_CORE_BLOCKS,
];

const StepEdit = ( { attributes, setAttributes, clientId } ) => {
	const { stepLabel, className, uniqueId } = attributes;
	const { isActive } = useStep( clientId );
	const formClientId = useParentFormClientId( clientId );

	// Prepare props for the block
	const blockProps = useBlockProps( {
		className: clsx( className, { 'is-active': isActive } ),
		'data-is-active-step': isActive,
	} );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Step settings', 'jetpack-forms' ) }>
					<TextControl
						label={ __( 'Step label', 'jetpack-forms' ) }
						value={ stepLabel }
						onChange={ value => setAttributes( { stepLabel: value } ) }
						help={ __( 'Label for this step, shown in the editor.', 'jetpack-forms' ) }
					/>
					<TextControl
						label={ __( 'Unique ID', 'jetpack-forms' ) }
						value={ uniqueId }
						onChange={ value => setAttributes( { uniqueId: value } ) }
						help={ __(
							'A unique ID for this step, used for analytics and targeting.',
							'jetpack-forms'
						) }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<InnerBlocks allowedBlocks={ ALLOWED_FORM_BLOCKS } />
			</div>
			<AddStepControls clientId={ clientId } formClientId={ formClientId } />
		</>
	);
};

export default StepEdit;
