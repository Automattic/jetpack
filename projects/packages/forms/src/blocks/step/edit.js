import {
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import AttributesControls from './attributes-controls';

import './editor.scss';

// Value used by parent controls to signify showing all steps
const ALL_STEPS_VALUE = '__all__';

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

	const { parentSelectedStepClientId, currentIndex } = useSelect(
		select => {
			const { getBlocks, getBlockParents, getBlockAttributes } = select( blockEditorStore );

			const parentClientId = getBlockParents( clientId )[ 0 ];
			const parentContainerBlocks = parentClientId ? getBlocks( parentClientId ) : [];
			const parentAttributes = parentClientId ? getBlockAttributes( parentClientId ) : null;
			const parentStepBlocks = parentContainerBlocks.filter(
				block => block.name === 'jetpack/form-step'
			);
			const currentStepIndex = parentStepBlocks.findIndex( block => block.clientId === clientId );

			return {
				currentIndex: currentStepIndex,
				parentSelectedStepClientId: parentAttributes?.selectedStepClientId ?? ALL_STEPS_VALUE,
				isFirstStep: currentStepIndex === 0,
				isLastStep: currentStepIndex === parentStepBlocks.length - 1,
			};
		},
		[ clientId ]
	);
	const isAllStepView = ! ( parentSelectedStepClientId !== ALL_STEPS_VALUE );
	// Only render the step content if it's the selected one or if "All Steps" is selected.
	if ( ! isAllStepView && parentSelectedStepClientId !== clientId ) {
		return null;
	}

	// Translators: %d is the step number (1, 2, 3, etc.)
	const defaultStepName = sprintf( __( 'Step %d', 'jetpack-forms' ), currentIndex + 1 );

	return (
		<div { ...blockProps }>
			{ isAllStepView && <StepBreak stepName={ attributes.stepName || defaultStepName } /> }
			<div className="jetpack-form-step__container" { ...innerBlocksProps }>
				{ children }
			</div>
			<AttributesControls
				attributes={ attributes }
				setAttributes={ setAttributes }
				clientId={ clientId }
			/>
		</div>
	);
}
