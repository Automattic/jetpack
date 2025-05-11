import {
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import useFormSteps from '../../hooks/use-form-steps';
import { store as previewStore } from '../../store/preview-store';
import StepControls from '../contact-form/components/step-controls';
import AttributesControls from './attributes-controls';

import './editor.scss';

// Define allowed blocks directly in this file to break circular dependency
const ALLOWED_BLOCKS = [
	'jetpack/field-text',
	'jetpack/field-name',
	'jetpack/field-email',
	'jetpack/field-url',
	'jetpack/field-date',
	'jetpack/field-telephone',
	'jetpack/field-textarea',
	'jetpack/field-checkbox',
	'jetpack/field-checkbox-multiple',
	'jetpack/field-option-checkbox',
	'jetpack/field-radio',
	'jetpack/field-option-radio',
	'jetpack/field-select',
	'jetpack/field-consent',
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

const STEP_TEMPLATE = [
	[ 'core/paragraph', {} ],
	[ 'jetpack/form-step-navigation', {} ],
];

function StepBreak( { stepName } ) {
	return (
		<div className="jetpack-form-step__break">
			<span className="jetpack-form-step__label">{ stepName }</span>
		</div>
	);
}

export default function Edit( { attributes, setAttributes, clientId } ) {
	const blockProps = useBlockProps();
	const { children, innerBlocksProps } = useInnerBlocksProps( blockProps, {
		template: STEP_TEMPLATE,
		allowedBlocks: ALLOWED_BLOCKS,
	} );

	const { ancestorFormClientId } = useSelect(
		select => {
			const { getBlockParentsByBlockName } = select( blockEditorStore );
			// Find the top-level contact form ancestor for the current step block
			return {
				ancestorFormClientId: getBlockParentsByBlockName( clientId, [
					'jetpack/contact-form',
				] )[ 0 ],
			};
		},
		[ clientId ]
	);

	const allStepsInForm = useFormSteps( ancestorFormClientId );

	const { currentIndex, selectedStepClientId, isPreview } = useSelect(
		select => {
			const { isPreviewMode, getActivePreviewStepId } = select( previewStore );

			const currentStepIndex = allStepsInForm.findIndex( block => block.clientId === clientId );

			return {
				currentIndex: currentStepIndex,
				selectedStepClientId: getActivePreviewStepId( ancestorFormClientId ),
				isPreview: isPreviewMode( ancestorFormClientId ),
			};
		},
		[ clientId, allStepsInForm, ancestorFormClientId ] // Dependencies updated
	);

	// Only render the step content if it's the selected one or if "All Steps" is selected.
	if ( isPreview && selectedStepClientId !== clientId ) {
		return null;
	}

	// Translators: %d is the step number (1, 2, 3, etc.)
	const defaultStepName = sprintf( __( 'Step %d', 'jetpack-forms' ), currentIndex + 1 );

	return (
		<>
			<div { ...blockProps }>
				{ ! isPreview && <StepBreak stepName={ attributes.stepName || defaultStepName } /> }
				<div className="jetpack-form-step__container" { ...innerBlocksProps }>
					{ children }
				</div>
				<AttributesControls
					attributes={ attributes }
					setAttributes={ setAttributes }
					clientId={ clientId }
				/>
			</div>
			<StepControls formClientId={ ancestorFormClientId } onlyNav={ true } isStep={ true } />
		</>
	);
}
