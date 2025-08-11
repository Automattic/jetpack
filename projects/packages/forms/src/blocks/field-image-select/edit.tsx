/**
 * External dependencies
 */
import {
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
	BlockControls,
} from '@wordpress/block-editor';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import JetpackFieldControls from '../shared/components/jetpack-field-controls';
import useAddImageChoice from '../shared/hooks/use-add-image-choice';
import useFormWrapper from '../shared/hooks/use-form-wrapper';
import useJetpackFieldStyles from '../shared/hooks/use-jetpack-field-styles';
/**
 * Types
 */
import type { Block, BlockEditorStoreSelect } from '../../types';

export default function ImageSelectFieldEdit( props ) {
	const { attributes, clientId, isSelected, setAttributes, name } = props;
	const { id, required, width } = attributes;
	const { blockStyle } = useJetpackFieldStyles( attributes );

	const { isInnerBlockSelected, choicesBlock } = useSelect(
		select => {
			const { hasSelectedInnerBlock, getBlock } = select(
				blockEditorStore
			) as BlockEditorStoreSelect;

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

	const { addChoice } = useAddImageChoice( choicesBlock?.clientId );

	const blockProps = useBlockProps( {
		className: clsx( 'jetpack-field jetpack-field-image-select', {
			'is-selected': isSelected || isInnerBlockSelected,
		} ),
		style: blockStyle,
	} );

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
