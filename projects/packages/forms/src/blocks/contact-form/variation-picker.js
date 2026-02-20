import { hasFeatureFlag } from '@automattic/jetpack-shared-extension-utils';
import {
	__experimentalBlockPatternSetup as BlockPatternSetup, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	BlockPreview,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { createBlock, store as blocksStore } from '@wordpress/blocks';
import { Button, Modal, TextControl, Icon } from '@wordpress/components';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect, useState, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { arrowUp, symbolFilled } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import clsx from 'clsx';
import { FORM_POST_TYPE } from '../shared/util/constants.js';
import './util/form-styles.js';
import applyVariationToFormBlock from './util/apply-variation.js';
import { createSyncedForm } from './util/create-synced-form.ts';

const createBlocksFromInnerBlocksTemplate = innerBlocksTemplate => {
	const blocks = innerBlocksTemplate.map( ( [ blockName, attr, innerBlocks = [] ] ) =>
		createBlock( blockName, attr, createBlocksFromInnerBlocksTemplate( innerBlocks ) )
	);

	return blocks;
};

/**
 * Creates blocks from an example innerBlocks structure (object format).
 *
 * @param {Array} innerBlocks - Array of block definitions in example format
 * @return {Array} Array of created blocks
 */
const createBlocksFromExample = innerBlocks => {
	if ( ! innerBlocks ) {
		return [];
	}
	return innerBlocks.map( block =>
		createBlock( block.name, block.attributes || {}, createBlocksFromExample( block.innerBlocks ) )
	);
};

/**
 * Component to render a preview of a form template variation.
 *
 * @param {object}   props           - Component props
 * @param {object}   props.variation - The form variation to preview
 * @param {Function} props.onClick   - Click handler when preview is selected
 * @return {JSX.Element} The form template preview component
 */
function FormTemplatePreview( { variation, onClick } ) {
	const previewBlocks = useMemo( () => {
		// Prefer example data if available (object format), otherwise use innerBlocks (template format)
		if ( variation.example?.innerBlocks ) {
			return createBlocksFromExample( variation.example.innerBlocks );
		}
		if ( variation.innerBlocks ) {
			return createBlocksFromInnerBlocksTemplate( variation.innerBlocks );
		}
		return [];
	}, [ variation ] );

	// Create a wrapper form block to preview
	const formBlock = useMemo( () => {
		return createBlock( 'jetpack/contact-form', variation.attributes || {}, previewBlocks );
	}, [ variation.attributes, previewBlocks ] );

	return (
		<div
			className="form-placeholder__template-card"
			onClick={ onClick }
			onKeyDown={ event => {
				if ( event.key === 'Enter' || event.key === ' ' ) {
					event.preventDefault();
					onClick();
				}
			} }
			role="button"
			tabIndex={ 0 }
			aria-label={ variation.title }
		>
			<div className="form-placeholder__template-preview">
				<BlockPreview
					blocks={ [ formBlock ] }
					viewportWidth={ 600 }
					minHeight={ 160 }
					additionalStyles={ [ { css: '.is-root-container { padding: 32px; }' } ] }
				/>
			</div>
			<div className="form-placeholder__template-label">
				<Icon icon={ symbolFilled } className="form-placeholder__template-icon" />
				<span className="form-placeholder__template-title">{ variation.title }</span>
			</div>
		</div>
	);
}

export default function VariationPicker( { blockName, setAttributes, clientId, classNames } ) {
	const registry = useRegistry();
	const [ isPatternsModalOpen, setIsPatternsModalOpen ] = useState( false );
	const [ promptValue, setPromptValue ] = useState( '' );
	const { replaceInnerBlocks, selectBlock } = useDispatch( blockEditorStore );
	const { createSuccessNotice } = useDispatch( noticesStore );
	const isCentralFormManagementEnabled = hasFeatureFlag( 'central-form-management' );
	const { blockType, defaultVariation, variations, currentPostType, currentPostId } = useSelect(
		select => {
			const { getBlockType, getBlockVariations, getDefaultBlockVariation } = select( blocksStore );
			const { getCurrentPostType, getCurrentPostId } = select( editorStore );

			return {
				blockType: getBlockType( blockName ),
				defaultVariation: getDefaultBlockVariation( blockName, 'block' ),
				variations: getBlockVariations( blockName, 'block' ),
				currentPostType: getCurrentPostType(),
				currentPostId: getCurrentPostId(),
			};
		},
		[ blockName ]
	);

	// Check if we're editing a jetpack-form post directly
	const isEditingJetpackFormPost = currentPostType === FORM_POST_TYPE;

	// Filter variations for display (exclude hidden ones and regular-form which is for transforms)
	const displayVariations = useMemo( () => {
		return variations.filter( v => ! v.hiddenFromPicker && v.name !== 'regular-form' );
	}, [ variations ] );

	// Limit to 6 templates for the grid display
	const gridVariations = useMemo( () => {
		return displayVariations.slice( 0, 6 );
	}, [ displayVariations ] );

	useEffect( () => {
		if (
			! isPatternsModalOpen &&
			window.location.search.indexOf( 'showJetpackFormsPatterns' ) !== -1
		) {
			setIsPatternsModalOpen( true );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	const handleVariationSelect = async ( nextVariation = defaultVariation ) => {
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
				const formBlockToCreate = createBlock(
					'jetpack/contact-form',
					nextVariation.attributes || {},
					innerBlocks
				);

				// Create synced form post and get its ID
				const formId = await createSyncedForm(
					formBlockToCreate,
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
	};

	const handlePromptSubmit = () => {
		// TODO: Implement AI form generation with promptValue
		// For now, this is a placeholder for future AI integration
		// eslint-disable-next-line no-console
		console.log( 'Form prompt submitted:', promptValue );
	};

	return (
		<div className={ clsx( classNames, 'is-placeholder' ) }>
			{ /* Header */ }
			<div className="form-placeholder__header">
				{ blockType?.icon && (
					<Icon icon={ blockType.icon.src } className="form-placeholder__header-icon" />
				) }
				<span className="form-placeholder__header-title">
					{ __( 'What form would you like to create?', 'jetpack-forms' ) }
				</span>
			</div>

			{ /* AI Prompt Input */ }
			<div className="form-placeholder__prompt">
				<TextControl
					__nextHasNoMarginBottom
					placeholder={ __( 'Type your form questions or goal…', 'jetpack-forms' ) }
					value={ promptValue }
					onChange={ setPromptValue }
					onKeyDown={ event => {
						if ( event.key === 'Enter' && promptValue.trim() ) {
							handlePromptSubmit();
						}
					} }
				/>
				<Button
					className="form-placeholder__prompt-submit"
					icon={ arrowUp }
					onClick={ handlePromptSubmit }
					disabled={ ! promptValue.trim() }
					label={ __( 'Generate form', 'jetpack-forms' ) }
				/>
			</div>

			{ /* Template Grid */ }
			<div className="form-placeholder__grid">
				{ gridVariations.map( variation => (
					<FormTemplatePreview
						key={ variation.name }
						variation={ variation }
						onClick={ () => handleVariationSelect( variation ) }
					/>
				) ) }
			</div>

			{ /* View All Forms Button */ }
			<div className="form-placeholder__actions">
				<Button
					__next40pxDefaultSize
					variant="secondary"
					className="form-placeholder__view-all"
					onClick={ () => setIsPatternsModalOpen( true ) }
				>
					{ __( 'View all forms', 'jetpack-forms' ) }
				</Button>
			</div>

			{ /* Patterns Modal */ }
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
