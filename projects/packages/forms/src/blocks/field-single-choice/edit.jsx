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
import JetpackFieldControls from '../shared/components/jetpack-field-controls.jsx';
import useFormWrapper from '../shared/hooks/use-form-wrapper.js';

export default function SingleChoiceFieldEdit( props ) {
	const { className, clientId, setAttributes, isSelected, attributes } = props;
	const { required, id, width } = attributes;

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

	const hasOtherOption = useSelect(
		select => {
			const block = select( blockEditorStore ).getBlock( clientId );
			const optionsBlock = block?.innerBlocks?.[ 1 ];

			return (
				optionsBlock?.innerBlocks?.some( innerBlock => innerBlock?.attributes?.isOther === true ) ??
				false
			);
		},
		[ clientId ]
	);

	const extraFieldSettings = [
		{
			element: (
				<ToggleControl
					label={ __( 'Include "Other" option', 'jetpack-forms' ) }
					checked={ !! hasOtherOption }
					onChange={ toggleValue => {
						const optionsBlock = innerBlocks?.[ 1 ];
						if ( ! optionsBlock ) {
							return;
						}

						if ( toggleValue ) {
							const newOption = createBlock( 'jetpack/option', {
								label: __( 'Other', 'jetpack-forms' ),
								isOther: true,
							} );

							insertBlock(
								newOption,
								optionsBlock.innerBlocks.length,
								optionsBlock.clientId,
								false
							);
						} else {
							optionsBlock.innerBlocks.forEach( b => {
								if ( b?.attributes?.isOther ) {
									removeBlock( b.clientId, false );
								}
							} );
						}
					} }
					help={ __(
						'Include an "Other" option with a text input field below it',
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
