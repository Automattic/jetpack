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
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import { getImageOptionLabel } from '../input-image-option/label';
import useAddImageOption from '../shared/hooks/use-add-image-option';
import useJetpackFieldStyles from '../shared/hooks/use-jetpack-field-styles';
/**
 * Types
 */
import type { BlockEditorStoreSelect } from '../../types';

export default function ImageOptionsFieldsetEdit( props ) {
	const { attributes, clientId, isSelected } = props;
	const { blockStyle } = useJetpackFieldStyles( attributes );

	const { addOption } = useAddImageOption( clientId );

	const { isInnerBlockSelected } = useSelect(
		select => {
			const { hasSelectedInnerBlock } = select( blockEditorStore ) as BlockEditorStoreSelect;

			return {
				isInnerBlockSelected: hasSelectedInnerBlock( clientId, true ),
			};
		},
		[ clientId ]
	);

	const blockProps = useBlockProps( {
		className: clsx( 'jetpack-field jetpack-fieldset-image-options', {
			'is-selected': isSelected || isInnerBlockSelected,
		} ),
		style: blockStyle,
	} );

	// Starts with 3 empty options.
	const template = [
		[ 'jetpack/input-image-option', { label: getImageOptionLabel( 1 ) } ],
		[ 'jetpack/input-image-option', { label: getImageOptionLabel( 2 ) } ],
		[ 'jetpack/input-image-option', { label: getImageOptionLabel( 3 ) } ],
	];

	const innerBlocksProps = useInnerBlocksProps(
		{ className: 'jetpack-fieldset-image-options__wrapper' },
		{
			allowedBlocks: [ 'jetpack/input-image-option' ],
			template,
			templateLock: false, // Allow adding, removing, and moving options
			orientation: 'horizontal',
		}
	);

	return (
		<div { ...blockProps }>
			<div { ...innerBlocksProps } />

			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton onClick={ addOption }>{ __( 'Add', 'jetpack-forms' ) }</ToolbarButton>
				</ToolbarGroup>
			</BlockControls>
		</div>
	);
}
