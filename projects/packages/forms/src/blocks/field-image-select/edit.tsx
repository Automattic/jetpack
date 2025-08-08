/**
 * External dependencies
 */
import {
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
	BlockControls,
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import { getImageChoiceLabel } from '../form-image-select-choice/label';
import JetpackFieldControls from '../shared/components/jetpack-field-controls';
import useFormWrapper from '../shared/hooks/use-form-wrapper';
import useJetpackFieldStyles from '../shared/hooks/use-jetpack-field-styles';
/**
 * Types
 */
import type { Block } from '../../types';

export default function ImageSelectFieldEdit( props ) {
	const { attributes, clientId, isSelected, setAttributes, name } = props;
	const { id, required, width } = attributes;
	const { blockStyle } = useJetpackFieldStyles( attributes );
	const { insertBlock } = useDispatch( blockEditorStore );

	const { isInnerBlockSelected, choicesBlock } = useSelect(
		select => {
			const { hasSelectedInnerBlock, getBlock } = select( blockEditorStore ) as {
				hasSelectedInnerBlock: ( clientId: string, isInnerBlock: boolean ) => boolean;
				getBlock: ( clientId: string ) => Block;
			};

			return {
				isInnerBlockSelected: hasSelectedInnerBlock( clientId, true ),
				choicesBlock: getBlock( clientId )?.innerBlocks.find(
					( block: Block ) => block.name === 'jetpack/form-image-select-choices'
				),
			};
		},
		[ clientId ]
	);

	// This wraps the field in a form block if it is added directly to the editor.
	useFormWrapper( { attributes, clientId, name } );

	const blockProps = useBlockProps( {
		className: clsx( 'jetpack-field jetpack-field-image-select', {
			'is-selected': isSelected || isInnerBlockSelected,
		} ),
		style: blockStyle,
	} );

	const addChoice = useCallback( () => {
		// If there is no choices block, return
		if ( ! choicesBlock ) {
			return;
		}

		const newIndex = choicesBlock.innerBlocks.length + 1;
		const newChoiceBlock = createBlock( 'jetpack/form-image-select-choice', {}, [
			createBlock( 'jetpack/label', {
				label: getImageChoiceLabel( newIndex ),
			} ),
			createBlock( 'core/image' ),
		] );

		insertBlock( newChoiceBlock, choicesBlock.innerBlocks.length, choicesBlock.clientId );
	}, [ choicesBlock, insertBlock ] );

	const template = useMemo( () => {
		return [
			[
				'jetpack/label',
				{
					label: __( 'Choose one option', 'jetpack-forms' ),
					required,
				},
			],
			[
				'jetpack/form-image-select-choices',
				{
					multiple: false,
				},
			],
		];
	}, [ required ] );

	const innerBlocksProps = useInnerBlocksProps(
		{ className: 'jetpack-field-image-select__wrapper' },
		{
			allowedBlocks: [ 'jetpack/label', 'jetpack/form-image-select-choices' ],
			template,
			templateLock: 'all', // The field must have exactly one label and one choices block.
		}
	);

	return (
		<div { ...blockProps }>
			<div { ...innerBlocksProps } />

			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton onClick={ addChoice }>{ __( 'Add', 'jetpack-forms' ) }</ToolbarButton>
				</ToolbarGroup>
			</BlockControls>

			<JetpackFieldControls
				id={ id }
				required={ required }
				attributes={ attributes }
				setAttributes={ setAttributes }
				width={ width }
			/>
		</div>
	);
}
