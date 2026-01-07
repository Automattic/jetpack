import {
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { ToggleControl } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import JetpackFieldControls from '../shared/components/jetpack-field-controls.js';
import useFormWrapper from '../shared/hooks/use-form-wrapper.js';

export default function SingleChoiceFieldEdit( props ) {
	const { className, clientId, setAttributes, isSelected, attributes } = props;
	const { required, id, width, allowOther } = attributes;

	useFormWrapper( props );

	const innerBlocks = useSelect(
		select => select( blockEditorStore ).getBlock( clientId ).innerBlocks,
		[ clientId ]
	);
	const { insertBlock, removeBlock } = useDispatch( blockEditorStore );
	const options = innerBlocks?.[ 1 ]?.innerBlocks;
	const classes = clsx( className, 'jetpack-field jetpack-field-multiple', {
		'is-selected': isSelected,
		'has-placeholder': !! options?.length,
	} );

	const blockProps = useBlockProps( { className: classes } );

	const innerBlockProps = useInnerBlocksProps( blockProps, {
		template: [
			[
				'jetpack/label',
				{
					label: __( 'Choose one option', 'jetpack-forms' ),
					placeholder: __( 'Add label…', 'jetpack-forms' ),
				},
			],
			[ 'jetpack/options', { type: 'radio' } ],
		],
		templateLock: 'all',
	} );

	const extraFieldSettings = [
		{
			element: (
				<ToggleControl
					key="allowOther"
					label={ __( 'Include "Other" option', 'jetpack-forms' ) }
					checked={ !! allowOther }
					onChange={ value => {
						setAttributes( { allowOther: value } );

						// Find the options container block (second inner block)
						const optionsBlock = innerBlocks?.[ 1 ];
						if ( ! optionsBlock ) {
							return;
						}

						if ( value ) {
							// If an "Other" option already exists, do nothing.
							const hasOther = optionsBlock.innerBlocks.some( b => b?.attributes?.isOther );
							if ( hasOther ) {
								return;
							}

							const newOption = createBlock( 'jetpack/option', {
								label: __( 'Other', 'jetpack-forms' ),
								isOther: true,
							} );

							insertBlock(
								newOption,
								optionsBlock.innerBlocks.length,
								optionsBlock.clientId,
								false // Don't update block selection
							);
						} else {
							// Remove any existing "Other" option blocks.
							optionsBlock.innerBlocks.forEach( b => {
								if ( b?.attributes?.isOther ) {
									removeBlock( b.clientId );
								}
							} );
						}
					} }
					help={ __(
						'Includes an "Other" option with a text input field below it',
						'jetpack-forms'
					) }
					__nextHasNoMarginBottom={ true }
				/>
			),
			index: 2,
		},
	];

	return (
		<>
			<div { ...innerBlockProps } />
			<JetpackFieldControls
				clientId={ clientId }
				id={ id }
				required={ required }
				attributes={ attributes }
				setAttributes={ setAttributes }
				type={ 'radio' }
				width={ width }
				hidePlaceholder
				extraFieldSettings={ extraFieldSettings }
			/>
		</>
	);
}
