import {
	__experimentalBlockVariationPicker as BlockVariationPicker, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalBlockPatternSetup as BlockPatternSetup, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { createBlock, store as blocksStore } from '@wordpress/blocks';
import { Button, Modal } from '@wordpress/components';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import useCreateFormFromVariation from './hooks/use-create-form-from-variation.ts';
import './util/form-styles.js';

const createBlocksFromInnerBlocksTemplate = innerBlocksTemplate => {
	const blocks = innerBlocksTemplate.map( ( [ blockName, attr, innerBlocks = [] ] ) =>
		createBlock( blockName, attr, createBlocksFromInnerBlocksTemplate( innerBlocks ) )
	);

	return blocks;
};

export default function VariationPicker( { blockName, setAttributes, clientId, classNames } ) {
	const registry = useRegistry();
	const [ isPatternsModalOpen, setIsPatternsModalOpen ] = useState( false );
	const { replaceInnerBlocks, selectBlock } = useDispatch( blockEditorStore );
	const { createForm } = useCreateFormFromVariation();
	const { blockType, defaultVariation, variations } = useSelect(
		select => {
			const { getBlockType, getBlockVariations, getDefaultBlockVariation } = select( blocksStore );

			return {
				blockType: getBlockType( blockName ),
				defaultVariation: getDefaultBlockVariation( blockName, 'block' ),
				variations: getBlockVariations( blockName, 'block' ),
			};
		},
		[ blockName ]
	);

	useEffect( () => {
		if (
			! isPatternsModalOpen &&
			window.location.search.indexOf( 'showJetpackFormsPatterns' ) !== -1
		) {
			setIsPatternsModalOpen( true );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	return (
		<div className={ clsx( classNames, 'is-placeholder' ) }>
			<BlockVariationPicker
				icon={ blockType?.icon?.src }
				label={ blockType?.title }
				instructions={ __(
					'Start by selecting one of these templates, or browse patterns.',
					'jetpack-forms'
				) }
				variations={ variations.filter( v => ! v.hiddenFromPicker ) }
				onSelect={ async ( nextVariation = defaultVariation ) => {
					// Create a new form in the database
					const formId = await createForm( {
						variationTitle: nextVariation.title,
					} );

					// Only proceed if form was successfully created
					if ( ! formId ) {
						// Form creation failed, don't update the block
						return;
					}

					registry.batch( () => {
						if ( nextVariation.attributes ) {
							setAttributes( {
								...nextVariation.attributes,
								// Set the formRef to the newly created form ID
								formRef: formId,
								// Set the form title to match the variation title
								formTitle: nextVariation.title,
								// Store the variation name for reference
								variationName: nextVariation.name,
							} );
						}

						if ( nextVariation.innerBlocks ) {
							replaceInnerBlocks(
								clientId,
								createBlocksFromInnerBlocksTemplate( nextVariation.innerBlocks )
							);
						}

						selectBlock( clientId );
					} );
				} }
			/>
			<div className="form-placeholder__footer">
				<Button variant="secondary" onClick={ () => setIsPatternsModalOpen( true ) }>
					{ __( 'Browse form patterns', 'jetpack-forms' ) }
				</Button>
			</div>
			{ isPatternsModalOpen && (
				<Modal
					className="form-placeholder__patterns-modal"
					title={ __( 'Choose a pattern', 'jetpack-forms' ) }
					closeLabel={ __( 'Cancel', 'jetpack-forms' ) }
					onRequestClose={ () => setIsPatternsModalOpen( false ) }
				>
					<BlockPatternSetup
						initialViewMode="grid"
						filterPatternsFn={ pattern => {
							return pattern.content.indexOf( 'jetpack/contact-form' ) !== -1;
						} }
						clientId={ clientId }
					/>
				</Modal>
			) }
		</div>
	);
}
