/**
 * External dependencies
 */
import { useBlockProps, useInnerBlocksProps, BlockControls } from '@wordpress/block-editor';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import useAddImageOption from '../shared/hooks/use-add-image-option';
import useJetpackFieldStyles from '../shared/hooks/use-jetpack-field-styles';

export default function ImageOptionsFieldsetEdit( props ) {
	const { attributes, clientId } = props;
	const { blockStyle } = useJetpackFieldStyles( attributes );

	const { addOption, newImageOption } = useAddImageOption( clientId );

	const blockProps = useBlockProps( {
		className: clsx( 'jetpack-field jetpack-fieldset-image-options' ),
		style: blockStyle,
	} );

	// Starts with 3 empty options.
	const template = [
		[ 'jetpack/input-image-option' ],
		[ 'jetpack/input-image-option' ],
		[ 'jetpack/input-image-option' ],
	];

	const defaultBlock = useMemo( () => newImageOption(), [ newImageOption ] );

	const innerBlocksProps = useInnerBlocksProps(
		{ className: 'jetpack-fieldset-image-options__wrapper' },
		{
			allowedBlocks: [ 'jetpack/input-image-option' ],
			template,
			templateLock: false, // Allow adding, removing, and moving options
			orientation: 'horizontal',
			defaultBlock,
			directInsert: true,
		}
	);

	return (
		<div { ...blockProps }>
			<div { ...innerBlocksProps } />

			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton onClick={ addOption }>
						{ __( 'Add choice', 'jetpack-forms' ) }
					</ToolbarButton>
				</ToolbarGroup>
			</BlockControls>
		</div>
	);
}
