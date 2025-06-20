import { useBlockProps, useInnerBlocksProps, InnerBlocks, RichText } from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as singleStepStore } from '../../store/form-step-preview';
import AddStepControls from '../shared/components/form-add-step-controls';
import StepControls from '../shared/components/form-step-controls';
import useFormSteps from '../shared/hooks/use-form-steps';
import useParentFormClientId from '../shared/hooks/use-parent-form-client-id';
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
	'jetpack/field-number',
	'jetpack/field-textarea',
	'jetpack/field-checkbox',
	'jetpack/field-checkbox-multiple',
	'jetpack/field-option-checkbox',
	'jetpack/field-radio',
	'jetpack/field-option-radio',
	'jetpack/field-select',
	'jetpack/field-file',
	'jetpack/field-consent',
	'jetpack/form-step-navigation',
	'jetpack/form-step-divider',
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

// Template helper: returns a default template when the previous step already
// contains a navigation block. We pass a simple boolean flag instead of the
// entire blocks array to keep the value stable between identical renders.
const getStepTemplate = hasPrevNavigation => {
	if ( hasPrevNavigation ) {
		return [
			[ 'core/paragraph', {} ],
			[ 'jetpack/form-step-navigation', {} ],
		];
	}
	return undefined;
};

function StepBreak( { stepLabel, currentIndex, setAttributes, clientId } ) {
	const { updateBlockAttributes, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( 'core/block-editor' );
	const { metadata } = useSelect(
		select => {
			const { getBlockAttributes } = select( 'core/block-editor' );
			return { metadata: getBlockAttributes( clientId )?.metadata };
		},
		[ clientId ]
	);

	const stepNumberString = sprintf(
		// translators: %d is the step number (1, 2, 3, etc.)
		__( 'Step %d', 'jetpack-forms' ),
		currentIndex + 1
	);

	// Build the full label string that should appear in List View.
	const listViewLabel =
		stepLabel && stepLabel !== ''
			? sprintf(
					/* translators: %1$d is the step number, %2$s is the custom label */ __(
						'Step %1$d – %2$s',
						'jetpack-forms'
					),
					currentIndex + 1,
					stepLabel
			  )
			: stepNumberString;

	// Keep List View label in sync whenever the label or step order changes.
	useEffect( () => {
		if ( metadata?.name === listViewLabel ) {
			return;
		}
		__unstableMarkNextChangeAsNotPersistent();
		updateBlockAttributes( clientId, {
			metadata: {
				...metadata,
				name: listViewLabel,
			},
		} );
	}, [
		listViewLabel,
		metadata,
		clientId,
		updateBlockAttributes,
		__unstableMarkNextChangeAsNotPersistent,
	] );

	// translators: %d: Step number
	const ariaLabel = sprintf( __( 'Step %d label', 'jetpack-forms' ), currentIndex + 1 );

	const handleChange = value => {
		setAttributes( { stepLabel: value } );
		// The effect above will run after this state update and handle metadata.
	};

	return (
		<div className="jetpack-form-step__break">
			{ /* Allow inline editing of step label */ }
			<RichText
				tagName="span"
				className="jetpack-form-step__label"
				value={ stepLabel }
				placeholder={ stepNumberString }
				onChange={ handleChange }
				aria-label={ ariaLabel }
			/>
		</div>
	);
}

export default function Edit( { attributes, setAttributes, clientId, isSelected } ) {
	const blockProps = useBlockProps();
	blockProps.className += ' jetpack-form-step__container';

	const ancestorFormClientId = useParentFormClientId( clientId );
	const steps = useFormSteps( ancestorFormClientId );
	const { setActiveStep } = useDispatch( singleStepStore );

	// Get information about the previous step and its blocks
	const {
		currentIndex,
		selectedStepClientId,
		isSingleStep,
		hasPrevNavigation,
		hasInnerBlocks,
		isInnerBlockSelected,
	} = useSelect(
		select => {
			const { isSingleStepMode, getActiveStepId } = select( singleStepStore );
			const { getBlocks, getBlock, hasSelectedInnerBlock } = select( 'core/block-editor' );

			const currentStepIndex = steps.findIndex( block => block.clientId === clientId );

			const prevStepId =
				currentStepIndex > 0 && steps[ currentStepIndex - 1 ]
					? steps[ currentStepIndex - 1 ].clientId
					: null;

			const prevBlocks = prevStepId ? getBlocks( prevStepId ) : [];

			const block = getBlock( clientId );

			return {
				currentIndex: currentStepIndex,
				selectedStepClientId: getActiveStepId( ancestorFormClientId ),
				isSingleStep: isSingleStepMode( ancestorFormClientId ),
				hasPrevNavigation: prevBlocks.some( b => b.name === 'jetpack/form-step-navigation' ),
				hasInnerBlocks: !! ( block && block.innerBlocks.length ),
				isInnerBlockSelected: hasSelectedInnerBlock( clientId, true ),
			};
		},
		[ clientId, steps, ancestorFormClientId ]
	);

	// Determine template based on whether this is a new block or not
	let renderAppender;
	if ( ! hasInnerBlocks && ! isSingleStep ) {
		renderAppender = InnerBlocks.ButtonBlockAppender;
	}

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: getStepTemplate( hasPrevNavigation ),
		allowedBlocks: ALLOWED_BLOCKS,
		renderAppender,
	} );

	useEffect( () => {
		if (
			isSingleStep &&
			( isSelected || isInnerBlockSelected ) &&
			selectedStepClientId !== clientId
		) {
			// When in single-step mode and a different step gains focus (e.g., via Document overview),
			// update the active step so the preview switches to the focused step.
			setActiveStep( ancestorFormClientId, clientId );
		}
	}, [
		isSingleStep,
		isSelected,
		isInnerBlockSelected,
		selectedStepClientId,
		clientId,
		ancestorFormClientId,
		setActiveStep,
	] );

	// Only render the step content if it's the selected one or if "All Steps" is selected.
	if ( isSingleStep && selectedStepClientId !== clientId ) {
		return null;
	}

	return (
		<>
			<div { ...blockProps }>
				{ ! isSingleStep && (
					<StepBreak
						stepLabel={ attributes.stepLabel }
						currentIndex={ currentIndex }
						setAttributes={ setAttributes }
						clientId={ clientId }
					/>
				) }
				<div { ...innerBlocksProps } />
				<AttributesControls
					attributes={ attributes }
					setAttributes={ setAttributes }
					clientId={ clientId }
				/>
			</div>
			<StepControls formClientId={ ancestorFormClientId } updateStepSelected={ true } />
			<AddStepControls clientId={ clientId } formClientId={ ancestorFormClientId } />
		</>
	);
}
