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
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
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

export default function ImageSelectFieldEdit( props ) {
	const { attributes, clientId, setAttributes, name } = props;
	const { id, required, width } = attributes;
	const { blockStyle } = useJetpackFieldStyles( attributes );

	const { optionsBlock } = useSelect(
		select => {
			const { getBlock } = select( blockEditorStore ) as BlockEditorStoreSelect;

			return {
				optionsBlock: getBlock( clientId )?.innerBlocks.find(
					( block: Block ) => block.name === 'jetpack/fieldset-image-options'
				),
			};
		},
		[ clientId ]
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
								onChange={ ( value: boolean ) => setAttributes( { isSupersized: value } ) }
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
							/>
						),
					},
				] }
			/>
		</div>
	);
}
