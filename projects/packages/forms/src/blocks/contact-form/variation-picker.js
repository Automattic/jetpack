import { hasFeatureFlag } from '@automattic/jetpack-shared-extension-utils';
import {
	__experimentalBlockVariationPicker as BlockVariationPicker, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalBlockPatternSetup as BlockPatternSetup, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { createBlock, serialize, store as blocksStore } from '@wordpress/blocks';
import { Button, Modal, SelectControl } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import clsx from 'clsx';
import { FORM_POST_TYPE } from '../shared/util/constants.js';
import './util/form-styles.js';
import applyVariationToFormBlock from './util/apply-variation.js';

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
	const isCentralFormManagementEnabled = hasFeatureFlag( 'central-form-management' );
	const { blockType, defaultVariation, variations, currentPostType, jetpackForms } = useSelect(
		select => {
			const { getBlockType, getBlockVariations, getDefaultBlockVariation } = select( blocksStore );
			const { getCurrentPostType } = select( editorStore );
			const { getEntityRecords } = select( coreStore );

			return {
				blockType: getBlockType( blockName ),
				defaultVariation: getDefaultBlockVariation( blockName, 'block' ),
				variations: getBlockVariations( blockName, 'block' ),
				currentPostType: getCurrentPostType(),
				jetpackForms:
					getEntityRecords( 'postType', FORM_POST_TYPE, {
						per_page: 100,
						status: 'publish',
						orderBy: 'modified',
					} ) || [],
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

	const handleFormSelection = formId => {
		if ( ! formId ) {
			return;
		}

		registry.batch( () => {
			setAttributes( { ref: parseInt( formId, 10 ) } );
			selectBlock( clientId );
		} );
	};

	return (
		<div className={ clsx( classNames, 'is-placeholder' ) }>
			<BlockVariationPicker
				icon={ blockType?.icon?.src }
				label={ blockType?.title }
				instructions={ __(
					'Start by selecting one of these templates, browse patterns, or select an existing form below.',
					'jetpack-forms'
				) }
				variations={ variations.filter( v => ! v.hiddenFromPicker ) }
				onSelect={ async ( nextVariation = defaultVariation ) => {
					// If we're editing a jetpack-form post directly, use the old behavior
					// (just set attributes and inner blocks, don't create another ref)
					if (
						isEditingJetpackFormPost ||
						isCentralFormManagementEnabled ||
						nextVariation.name === 'regular-form'
					) {
						applyVariationToFormBlock( {
							batch: registry.batch,
							setAttributes,
							replaceInnerBlocks,
							selectBlock,
							clientId,
							variation: nextVariation,
							createBlocksFromTemplate: createBlocksFromInnerBlocksTemplate,
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
							// Fallback to applying variation locally
							applyVariationToFormBlock( {
								batch: registry.batch,
								setAttributes,
								replaceInnerBlocks,
								selectBlock,
								clientId,
								variation: nextVariation,
								createBlocksFromTemplate: createBlocksFromInnerBlocksTemplate,
							} );
						}
					}
				} }
			/>
			<div className="form-placeholder__footer">
				<Button variant="secondary" onClick={ () => setIsPatternsModalOpen( true ) }>
					{ __( 'Browse form patterns', 'jetpack-forms' ) }
				</Button>
				{ ! isEditingJetpackFormPost && isCentralFormManagementEnabled && (
					<SelectControl
						label={ __( 'Or select an existing form', 'jetpack-forms' ) }
						value=""
						options={ [
							{ label: __( 'Select a form…', 'jetpack-forms' ), value: '' },
							...jetpackForms.map( form => ( {
								label: form.title?.rendered || __( '(Untitled)', 'jetpack-forms' ),
								value: form.id.toString(),
							} ) ),
						] }
						onChange={ handleFormSelection }
					/>
				) }
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
