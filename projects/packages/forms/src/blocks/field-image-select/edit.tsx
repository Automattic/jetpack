/**
 * External dependencies
 */
import {
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
	BlockControls,
} from '@wordpress/block-editor';
import { ToggleControl, ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect, select as globalSelect } from '@wordpress/data';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import JetpackFieldControls from '../shared/components/jetpack-field-controls';
import useAddImageOption from '../shared/hooks/use-add-image-option';
import useFormWrapper from '../shared/hooks/use-form-wrapper';
import useJetpackFieldStyles from '../shared/hooks/use-jetpack-field-styles';
import './style.scss';
import './editor.scss';
/**
 * Types
 */
import type { Block, BlockEditorStoreSelect } from '../../types';
import type { Attachment } from '@wordpress/core-data';

export default function ImageSelectFieldEdit( props ) {
	const { attributes, clientId, setAttributes, name } = props;
	const { id, required, width } = attributes;
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const { blockStyle } = useJetpackFieldStyles( attributes );

	const { optionsBlock, imagesData } = useSelect(
		select => {
			const { getBlock } = select( blockEditorStore ) as BlockEditorStoreSelect;

			const block = getBlock( clientId )?.innerBlocks.find(
				( innerBlock: Block ) => innerBlock.name === 'jetpack/fieldset-image-options'
			);

			const images =
				block?.innerBlocks?.[ 0 ]?.innerBlocks
					// Filter out inner blocks that don't have a media id, i.e. external images.
					?.filter( innerBlock => innerBlock.attributes?.id !== undefined )
					// Map the inner blocks to an array of objects with the media id and client id.
					?.map( innerBlock => ( {
						clientId: innerBlock.clientId,
						mediaId: innerBlock.attributes.id as number,
					} ) ) ?? [];

			return {
				optionsBlock: block,
				imagesData: images,
			};
		},
		[ clientId ]
	);

	// Preload the image entity records reactively, as they are not available on first load.
	// This is necessary to ensure the image URLs can be updated correctly when the supersized attribute is changed.
	useSelect(
		select => {
			return imagesData.map( image =>
				select( coreStore ).getEntityRecord( 'postType', 'attachment', image.mediaId, {
					context: 'view',
				} )
			);
		},
		[ imagesData ]
	);

	// This wraps the field in a form block if it is added directly to the editor.
	useFormWrapper( { attributes, clientId, name } );

	const { addOption } = useAddImageOption( optionsBlock?.clientId );

	const blockProps = useBlockProps( {
		className: clsx(
			'jetpack-field jetpack-field-image-select is-non-animated-label is-non-outlined-block'
		),
		style: blockStyle,
	} );

	const template = useMemo( () => {
		return [
			[
				'jetpack/label',
				{
					label: __( 'Choose one image', 'jetpack-forms' ),
					required,
				},
			],
			[
				'jetpack/fieldset-image-options',
				{
					multiple: false,
				},
			],
		];
	}, [ required ] );

	const innerBlocksProps = useInnerBlocksProps(
		{ className: 'jetpack-field-image-select__wrapper' },
		{
			allowedBlocks: [ 'jetpack/label', 'jetpack/fieldset-image-options' ],
			template,
			templateLock: 'all', // The field must have exactly one label and one options fieldset block.
		}
	);

	const updateSupersized = useCallback(
		( value: boolean ) => {
			setAttributes( { isSupersized: value } );

			const inputImageOptions = optionsBlock?.innerBlocks;

			if ( inputImageOptions && inputImageOptions.length > 0 ) {
				const imageBlocks = inputImageOptions.map( ( block: Block ) => block.innerBlocks[ 0 ] );
				const newSizeSlug = value ? 'full' : 'medium';

				imageBlocks.forEach( imageBlock => {
					updateBlockAttributes( imageBlock.clientId, {
						sizeSlug: newSizeSlug,
					} );

					const record = globalSelect( coreStore ).getEntityRecord(
						'postType',
						'attachment',
						imageBlock.attributes.id as number,
						{
							context: 'view',
						}
					);

					const newUrl = ( record as Attachment )?.media_details?.sizes?.[ newSizeSlug ]
						?.source_url;

					if ( newUrl ) {
						updateBlockAttributes( imageBlock.clientId, {
							url: newUrl,
						} );
					}
				} );
			}
		},
		[ setAttributes, optionsBlock?.innerBlocks, updateBlockAttributes ]
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

			<JetpackFieldControls
				id={ id }
				required={ required }
				attributes={ attributes }
				setAttributes={ setAttributes }
				width={ width }
				extraFieldSettings={ [
					{
						index: 1,
						element: (
							<ToggleControl
								__nextHasNoMarginBottom
								key="show-labels"
								label={ __( 'Show labels', 'jetpack-forms' ) }
								checked={ attributes?.showLabels }
								onChange={ ( value: boolean ) => setAttributes( { showLabels: value } ) }
								help={ __(
									'Displays the labels for the images in the published form. They are always visible for you in the editor and in the responses.',
									'jetpack-forms'
								) }
							/>
						),
					},
					{
						index: 2,
						element: (
							<ToggleControl
								__nextHasNoMarginBottom
								key="is-supersized"
								label={ __( 'Supersized', 'jetpack-forms' ) }
								checked={ attributes?.isSupersized }
								onChange={ ( value: boolean ) => updateSupersized( value ) }
								help={ __( 'Changes the size of the images.', 'jetpack-forms' ) }
							/>
						),
					},
					{
						index: 3,
						element: (
							<ToggleControl
								__nextHasNoMarginBottom
								key="is-multiple"
								label={ __( 'Multiple selection', 'jetpack-forms' ) }
								checked={ attributes?.isMultiple }
								onChange={ ( value: boolean ) => setAttributes( { isMultiple: value } ) }
								help={ __( 'Allows visitors to select more than one image.', 'jetpack-forms' ) }
							/>
						),
					},
					{
						index: 4,
						element: (
							<ToggleControl
								__nextHasNoMarginBottom
								key="randomize-options"
								label={ __( 'Randomize', 'jetpack-forms' ) }
								checked={ attributes?.randomizeOptions }
								onChange={ ( value: boolean ) => setAttributes( { randomizeOptions: value } ) }
								help={ __(
									'Randomizes the order of the images in the published form to avoid order bias. This setting does not affect the order in the editor.',
									'jetpack-forms'
								) }
							/>
						),
					},
				] }
			/>
		</div>
	);
}
