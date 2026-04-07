import { hasFeatureFlag } from '@automattic/jetpack-shared-extension-utils';
import {
	__experimentalBlockVariationPicker as BlockVariationPicker, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalBlockPatternSetup as BlockPatternSetup, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { createBlock, store as blocksStore } from '@wordpress/blocks';
import { Button, Modal, SelectControl } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import clsx from 'clsx';
import { FORM_POST_TYPE } from '../shared/util/constants.js';
import './util/form-styles.js';
import applyVariationToFormBlock from './util/apply-variation.js';
import { createSyncedForm } from './util/create-synced-form.ts';
import { handleFormSelection } from './util/handle-form-selection.js';

const createBlocksFromInnerBlocksTemplate = innerBlocksTemplate => {
	const blocks = innerBlocksTemplate.map( ( [ blockName, attr, innerBlocks = [] ] ) =>
		createBlock( blockName, attr, createBlocksFromInnerBlocksTemplate( innerBlocks ) )
	);

	return blocks;
};

// Stable references to avoid useSelect re-fetching on every render
const EMPTY_FORMS_ARRAY = [];
const FORMS_QUERY = {
	per_page: 100,
	status: 'publish',
	orderby: 'modified',
};

export default function VariationPicker( { blockName, setAttributes, clientId, classNames } ) {
	const registry = useRegistry();
	const [ isPatternsModalOpen, setIsPatternsModalOpen ] = useState( false );
	const { replaceInnerBlocks, selectBlock } = useDispatch( blockEditorStore );
	const { createSuccessNotice } = useDispatch( noticesStore );
	const isCentralFormManagementEnabled = hasFeatureFlag( 'central-form-management' );
	const { blockType, defaultVariation, variations, currentPostType, currentPostId, jetpackForms } =
		useSelect(
			select => {
				const { getBlockType, getBlockVariations, getDefaultBlockVariation } =
					select( blocksStore );
				const { getCurrentPostType, getCurrentPostId } = select( editorStore );
				const { getEntityRecords } = select( coreStore );

				return {
					blockType: getBlockType( blockName ),
					defaultVariation: getDefaultBlockVariation( blockName, 'block' ),
					variations: getBlockVariations( blockName, 'block' ),
					currentPostType: getCurrentPostType(),
					currentPostId: getCurrentPostId(),
					jetpackForms:
						getEntityRecords( 'postType', FORM_POST_TYPE, FORMS_QUERY ) ?? EMPTY_FORMS_ARRAY,
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

	const onFormSelect = formId => {
		handleFormSelection( {
			formId,
			batch: registry.batch,
			setAttributes,
			selectBlock,
			clientId,
		} );
	};

	const hasExistingForms = jetpackForms && jetpackForms.length > 0;

	const showFormPicker =
		! isEditingJetpackFormPost && isCentralFormManagementEnabled && hasExistingForms;

	const getInstructions = () => {
		// Each translated string is assigned to a variable to prevent the minifier
		// from collapsing them into a single __() call with a ternary argument,
		// which breaks the i18n string literal requirement.
		if ( isCentralFormManagementEnabled && showFormPicker ) {
			const msg = __(
				'Start by selecting one of these templates or select an existing form below.',
				'jetpack-forms'
			);
			return msg;
		}
		if ( isCentralFormManagementEnabled ) {
			const msg = __( 'Start by selecting one of these templates.', 'jetpack-forms' );
			return msg;
		}
		if ( hasExistingForms ) {
			const msg = __(
				'Start by selecting one of these templates, browse patterns, or select an existing form below.',
				'jetpack-forms'
			);
			return msg;
		}
		const msg = __(
			'Start by selecting one of these templates or browse patterns.',
			'jetpack-forms'
		);
		return msg;
	};

	return (
		<div className={ clsx( classNames, 'is-placeholder' ) }>
			<BlockVariationPicker
				icon={ blockType?.icon?.src }
				label={ blockType?.title }
				instructions={ getInstructions() }
				variations={ variations.filter( v => ! v.hiddenFromPicker ) }
				onSelect={ async ( nextVariation = defaultVariation ) => {
					// If we're editing a jetpack-form post directly, or central form management
					// is disabled, use the "old" behavior: apply the variation directly to this
					// block by setting attributes and inner blocks, without creating a synced
					// form post (i.e., without creating or updating a ref). This avoids relying
					// on central form management when it is not available or not appropriate.
					if (
						isEditingJetpackFormPost ||
						! isCentralFormManagementEnabled ||
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

							// Create synced form post and get its ID
							const formId = await createSyncedForm(
								formBlock,
								nextVariation.title || 'Form',
								currentPostId
							);

							// Set ONLY ref attribute
							registry.batch( () => {
								setAttributes( { ref: formId } );
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
			{ ! isCentralFormManagementEnabled && (
				<div className="form-placeholder__shell">
					<Button
						__next40pxDefaultSize
						variant="secondary"
						onClick={ () => setIsPatternsModalOpen( true ) }
					>
						{ __( 'Browse form patterns', 'jetpack-forms' ) }
					</Button>
				</div>
			) }
			{ showFormPicker && (
				<div className="form-placeholder__shell">
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Or select an existing form', 'jetpack-forms' ) }
						options={ [
							{ label: __( 'Select a form…', 'jetpack-forms' ), value: '' },
							...jetpackForms.map( form => ( {
								label:
									decodeEntities( form.title?.rendered || '' ) ||
									__( '(Untitled)', 'jetpack-forms' ),
								value: form.id.toString(),
							} ) ),
						] }
						onChange={ onFormSelect }
					/>
				</div>
			) }
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
