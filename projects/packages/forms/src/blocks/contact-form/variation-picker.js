import {
	__experimentalBlockVariationPicker as BlockVariationPicker, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalBlockPatternSetup as BlockPatternSetup, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { createBlock, serialize, store as blocksStore } from '@wordpress/blocks';
import { Button, Modal } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import clsx from 'clsx';
import { FORM_POST_TYPE } from '../shared/util/constants.js';

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
	const { saveEntityRecord } = useDispatch( coreStore );
	const { createSuccessNotice } = useDispatch( noticesStore );
	const { blockType, defaultVariation, variations, currentPostType } = useSelect(
		select => {
			const { getBlockType, getBlockVariations, getDefaultBlockVariation } = select( blocksStore );
			const { getCurrentPostType } = select( editorStore );

			return {
				blockType: getBlockType( blockName ),
				defaultVariation: getDefaultBlockVariation( blockName, 'block' ),
				variations: getBlockVariations( blockName, 'block' ),
				currentPostType: getCurrentPostType(),
			};
		},
		[ blockName ]
	);

	// Check if we're editing a jetpack-form post directly
	const isEditingJetpackFormPost = currentPostType === FORM_POST_TYPE;

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
					// If we're editing a jetpack-form post directly, use the old behavior
					// (just set attributes and inner blocks, don't create another ref)
					if ( isEditingJetpackFormPost || nextVariation.name === 'regular-form' ) {
						registry.batch( () => {
							if ( nextVariation.attributes ) {
								setAttributes( nextVariation.attributes );
							}
							if ( nextVariation.innerBlocks ) {
								replaceInnerBlocks(
									clientId,
									createBlocksFromInnerBlocksTemplate( nextVariation.innerBlocks )
								);
							}
							selectBlock( clientId );
						} );
					} else {
						// We're editing a regular post/page - create a synced form with ref
						try {
							// Create inner blocks from template
							const innerBlocks = createBlocksFromInnerBlocksTemplate( nextVariation.innerBlocks );

							// Create the full jetpack/contact-form block with attributes and inner blocks
							const formBlock = createBlock(
								'jetpack/contact-form',
								nextVariation.attributes || {},
								innerBlocks
							);

							// Serialize the entire form block to block markup
							const serialized = serialize( formBlock );

							// Create jetpack-form post
							const post = await saveEntityRecord( 'postType', FORM_POST_TYPE, {
								title: nextVariation.title || 'Form',
								content: serialized,
								status: 'publish',
							} );

							// Set ONLY ref attribute
							registry.batch( () => {
								setAttributes( { ref: post.id } );
								selectBlock( clientId );
							} );

							// Show success notice
							createSuccessNotice( __( 'New form created.', 'jetpack-forms' ), {
								type: 'snackbar',
								isDismissible: true,
							} );
						} catch ( error ) {
							// eslint-disable-next-line no-console
							console.error( 'Failed to create synced form:', error );
							// Fallback to old behavior
							registry.batch( () => {
								if ( nextVariation.attributes ) {
									setAttributes( nextVariation.attributes );
								}
								if ( nextVariation.innerBlocks ) {
									replaceInnerBlocks(
										clientId,
										createBlocksFromInnerBlocksTemplate( nextVariation.innerBlocks )
									);
								}
								selectBlock( clientId );
							} );
						}
					}
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
