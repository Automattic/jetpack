import { AIControl, useAiSuggestions } from '@automattic/jetpack-ai-client';
import {
	hasFeatureFlag,
	getJetpackExtensionAvailability,
} from '@automattic/jetpack-shared-extension-utils';
import { BlockPreview, store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock, parse, store as blocksStore } from '@wordpress/blocks';
import { Button, Modal, Icon, Spinner } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect, useState, useMemo, memo, useCallback, useRef } from '@wordpress/element';
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

// Stable reference for additionalStyles to prevent BlockPreview re-renders
const PREVIEW_ADDITIONAL_STYLES = [ { css: '.is-root-container { padding: 32px; }' } ];

/**
 * Fix incomplete HTML by using the browser's parser.
 *
 * @param {string} html - The HTML to fix
 * @return {string} Fixed HTML
 */
const fixIncompleteHTML = html => {
	const div = document.createElement( 'div' );
	div.innerHTML = html;
	return div.innerHTML;
};

/**
 * Process AI suggestion content to extract valid form blocks.
 * Based on JetpackFormHandler.setContent from the AI assistant extension.
 *
 * @param {string} content - The AI-generated content
 * @return {Array} Array of valid blocks
 */
const processAiFormContent = content => {
	// Remove the Jetpack Form block wrapper from the content
	const processedContent = content.replace(
		/<!-- (\/)*wp:jetpack\/(contact-)*form ({[^}]*} )*(\/)*-->/g,
		''
	);

	// Fix incomplete HTML tags
	const fixedContent = fixIncompleteHTML( processedContent );

	// Parse the content into blocks
	const parsedBlocks = parse( fixedContent );

	// Filter out invalid or problematic blocks
	const validBlocks = parsedBlocks.filter( block => {
		return (
			block.isValid && ! [ 'core/freeform', 'core/missing', 'core/html' ].includes( block.name )
		);
	} );

	return validBlocks;
};

/**
 * Component to render a preview of a form template variation.
 * Memoized to prevent re-renders when parent state changes (e.g., typing in AI input).
 *
 * @param {object}   props           - Component props
 * @param {object}   props.variation - The form variation to preview
 * @param {Function} props.onClick   - Click handler when preview is selected
 * @return {JSX.Element} The form template preview component
 */
const FormTemplatePreview = memo( function FormTemplatePreview( { variation, onClick } ) {
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

	// Memoize the blocks array to prevent BlockPreview re-renders
	const blocks = useMemo( () => [ formBlock ], [ formBlock ] );

	const handleKeyDown = useCallback(
		event => {
			if ( event.key === 'Enter' || event.key === ' ' ) {
				event.preventDefault();
				onClick();
			}
		},
		[ onClick ]
	);

	return (
		<div
			className="form-placeholder__template-card"
			onClick={ onClick }
			onKeyDown={ handleKeyDown }
			role="button"
			tabIndex={ 0 }
			aria-label={ variation.title }
		>
			<div className="form-placeholder__template-preview">
				<BlockPreview
					blocks={ blocks }
					viewportWidth={ 600 }
					minHeight={ 160 }
					additionalStyles={ PREVIEW_ADDITIONAL_STYLES }
				/>
			</div>
			<div className="form-placeholder__template-label">
				<Icon icon={ symbolFilled } className="form-placeholder__template-icon" />
				<span className="form-placeholder__template-title">{ variation.title }</span>
			</div>
		</div>
	);
} );

/**
 * Component to render a preview of an existing form from the jetpack_form post type.
 * Memoized to prevent re-renders.
 *
 * @param {object}   props         - Component props
 * @param {object}   props.form    - The form post object
 * @param {Function} props.onClick - Click handler when form is selected
 * @return {JSX.Element} The existing form preview component
 */
const ExistingFormPreview = memo( function ExistingFormPreview( { form, onClick } ) {
	// Parse the form content to get blocks for preview
	const blocks = useMemo( () => {
		if ( ! form?.content?.raw ) {
			return [];
		}
		const parsedBlocks = parse( form.content.raw );
		return parsedBlocks.length > 0 ? parsedBlocks : [];
	}, [ form?.content?.raw ] );

	const handleKeyDown = useCallback(
		event => {
			if ( event.key === 'Enter' || event.key === ' ' ) {
				event.preventDefault();
				onClick();
			}
		},
		[ onClick ]
	);

	const title = form?.title?.rendered || form?.title?.raw || __( 'Untitled Form', 'jetpack-forms' );

	return (
		<div
			className="form-placeholder__template-card"
			onClick={ onClick }
			onKeyDown={ handleKeyDown }
			role="button"
			tabIndex={ 0 }
			aria-label={ title }
		>
			<div className="form-placeholder__template-preview">
				<BlockPreview
					blocks={ blocks }
					viewportWidth={ 600 }
					minHeight={ 160 }
					additionalStyles={ PREVIEW_ADDITIONAL_STYLES }
				/>
			</div>
			<div className="form-placeholder__template-label">
				<Icon icon={ symbolFilled } className="form-placeholder__template-icon" />
				<span className="form-placeholder__template-title">{ title }</span>
			</div>
		</div>
	);
} );

export default function VariationPicker( { blockName, setAttributes, clientId, classNames } ) {
	const registry = useRegistry();
	const [ isFormsModalOpen, setIsFormsModalOpen ] = useState( false );
	const [ promptValue, setPromptValue ] = useState( '' );
	const { replaceInnerBlocks, selectBlock } = useDispatch( blockEditorStore );
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
	const isCentralFormManagementEnabled = hasFeatureFlag( 'central-form-management' );
	const isAiAssistantAvailable = getJetpackExtensionAvailability( 'ai-assistant' ).available;

	// Track valid blocks during streaming for progressive updates
	const currentValidBlocksRef = useRef( [] );

	const {
		blockType,
		defaultVariation,
		variations,
		currentPostType,
		currentPostId,
		existingForms,
		isLoadingForms,
	} = useSelect(
		select => {
			const { getBlockType, getBlockVariations, getDefaultBlockVariation } = select( blocksStore );
			const { getCurrentPostType, getCurrentPostId } = select( editorStore );
			const { getEntityRecords, isResolving } = select( coreStore );

			// Fetch existing forms from jetpack_form post type
			const forms = getEntityRecords( 'postType', FORM_POST_TYPE, {
				per_page: 100,
				status: 'publish',
				orderby: 'modified',
				order: 'desc',
			} );

			return {
				blockType: getBlockType( blockName ),
				defaultVariation: getDefaultBlockVariation( blockName, 'block' ),
				variations: getBlockVariations( blockName, 'block' ),
				currentPostType: getCurrentPostType(),
				currentPostId: getCurrentPostId(),
				existingForms: forms || [],
				isLoadingForms: isResolving( 'getEntityRecords', [
					'postType',
					FORM_POST_TYPE,
					{ per_page: 100, status: 'publish', orderby: 'modified', order: 'desc' },
				] ),
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

	// Handle AI suggestion streaming - update form blocks progressively
	const handleAiSuggestion = useCallback(
		suggestion => {
			const validBlocks = processAiFormContent( suggestion );

			// Only update if we have new valid blocks
			if ( validBlocks.length > 0 && validBlocks.length >= currentValidBlocksRef.current.length ) {
				currentValidBlocksRef.current = validBlocks;
				replaceInnerBlocks( clientId, validBlocks );
			}
		},
		[ clientId, replaceInnerBlocks ]
	);

	// Handle AI completion - finalize the form
	const handleAiDone = useCallback(
		suggestion => {
			const validBlocks = processAiFormContent( suggestion );

			// Ensure we have at least a submit button
			const hasButton = validBlocks.some( block => block.name === 'jetpack/button' );
			const hasNavigation = validBlocks.some(
				block => block.name === 'jetpack/form-step-navigation'
			);

			let finalBlocks = validBlocks;

			if ( ! hasButton && ! hasNavigation && validBlocks.length > 0 ) {
				// Add a submit button if missing
				finalBlocks = [
					...validBlocks,
					createBlock( 'jetpack/button', {
						label: __( 'Submit', 'jetpack-forms' ),
						element: 'button',
						text: __( 'Submit', 'jetpack-forms' ),
						borderRadius: 8,
						lock: { remove: true },
					} ),
				];
			}

			if ( finalBlocks.length > 0 ) {
				registry.batch( () => {
					replaceInnerBlocks( clientId, finalBlocks );
					selectBlock( clientId );
				} );

				createSuccessNotice( __( 'Form created with AI.', 'jetpack-forms' ), {
					type: 'snackbar',
					isDismissible: true,
				} );
			}

			// Reset tracking ref
			currentValidBlocksRef.current = [];
			setPromptValue( '' );
		},
		[ clientId, createSuccessNotice, registry, replaceInnerBlocks, selectBlock ]
	);

	// Handle AI errors
	const handleAiError = useCallback(
		error => {
			// eslint-disable-next-line no-console
			console.error( 'AI form generation error:', error );
			createErrorNotice(
				error?.message || __( 'Failed to generate form. Please try again.', 'jetpack-forms' ),
				{
					type: 'snackbar',
					isDismissible: true,
				}
			);
			currentValidBlocksRef.current = [];
		},
		[ createErrorNotice ]
	);

	// Setup the AI suggestions hook
	const {
		request: requestAiSuggestion,
		requestingState,
		stopSuggestion,
	} = useAiSuggestions( {
		onSuggestion: handleAiSuggestion,
		onDone: handleAiDone,
		onError: handleAiError,
		askQuestionOptions: {
			postId: currentPostId,
			feature: 'jetpack-form-ai-extension',
		},
	} );

	const isAiGenerating = requestingState === 'requesting' || requestingState === 'suggesting';

	useEffect( () => {
		if ( ! isFormsModalOpen && window.location.search.indexOf( 'showJetpackFormsModal' ) !== -1 ) {
			setIsFormsModalOpen( true );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	const handleVariationSelect = useCallback(
		async ( nextVariation = defaultVariation ) => {
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
		},
		[
			clientId,
			createSuccessNotice,
			currentPostId,
			defaultVariation,
			isCentralFormManagementEnabled,
			isEditingJetpackFormPost,
			registry,
			replaceInnerBlocks,
			selectBlock,
			setAttributes,
		]
	);

	const handlePromptSubmit = useCallback( () => {
		if ( ! promptValue.trim() || isAiGenerating ) {
			return;
		}

		// Build the prompt message for form generation
		const messages = [
			{
				role: 'jetpack-ai',
				context: {
					type: 'form-ai-extension',
					content: '', // Empty form content since we're creating a new form
					request: promptValue.trim(),
				},
			},
		];

		// Reset tracking ref before starting
		currentValidBlocksRef.current = [];

		// Send the AI request
		requestAiSuggestion( messages );
	}, [ promptValue, isAiGenerating, requestAiSuggestion ] );

	// Handle stopping the AI generation
	const handleStopGeneration = useCallback( () => {
		stopSuggestion();
		currentValidBlocksRef.current = [];
	}, [ stopSuggestion ] );

	// Handle selecting an existing form
	const handleExistingFormSelect = useCallback(
		form => {
			if ( ! form?.id ) {
				return;
			}

			// Set the ref attribute to use the existing form
			registry.batch( () => {
				setAttributes( { ref: form.id } );
				selectBlock( clientId );
			} );

			setIsFormsModalOpen( false );

			createSuccessNotice( __( 'Existing form selected.', 'jetpack-forms' ), {
				type: 'snackbar',
				isDismissible: true,
			} );
		},
		[ clientId, createSuccessNotice, registry, selectBlock, setAttributes ]
	);

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

			{ /* AI Prompt Input - only shown when AI Assistant is available */ }
			{ isAiAssistantAvailable && (
				<div className="form-placeholder__prompt">
					<AIControl
						placeholder={ __( 'Type your form questions or goal…', 'jetpack-forms' ) }
						value={ promptValue }
						onChange={ setPromptValue }
						disabled={ isAiGenerating }
						state="init"
						actions={
							isAiGenerating ? (
								<Button
									className="form-placeholder__prompt-submit"
									onClick={ handleStopGeneration }
									label={ __( 'Stop generating', 'jetpack-forms' ) }
								>
									<Spinner />
								</Button>
							) : (
								<Button
									className="form-placeholder__prompt-submit"
									icon={ arrowUp }
									onClick={ handlePromptSubmit }
									disabled={ ! promptValue.trim() }
									label={ __( 'Generate form', 'jetpack-forms' ) }
								/>
							)
						}
					/>
				</div>
			) }

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

			{ /* View All Forms Button - only show if there are existing forms */ }
			{ existingForms.length > 0 && (
				<div className="form-placeholder__actions">
					<Button
						__next40pxDefaultSize
						variant="secondary"
						className="form-placeholder__view-all"
						onClick={ () => setIsFormsModalOpen( true ) }
					>
						{ __( 'Choose existing form', 'jetpack-forms' ) }
					</Button>
				</div>
			) }

			{ /* Existing Forms Modal */ }
			{ isFormsModalOpen && (
				<Modal
					className="form-placeholder__forms-modal"
					title={ __( 'Choose a form', 'jetpack-forms' ) }
					closeLabel={ __( 'Cancel', 'jetpack-forms' ) }
					onRequestClose={ () => setIsFormsModalOpen( false ) }
				>
					{ isLoadingForms && (
						<div className="form-placeholder__forms-loading">
							<Spinner />
						</div>
					) }
					{ ! isLoadingForms && existingForms.length === 0 && (
						<p>{ __( 'No forms found.', 'jetpack-forms' ) }</p>
					) }
					{ ! isLoadingForms && existingForms.length > 0 && (
						<div className="form-placeholder__forms-grid">
							{ existingForms.map( form => (
								<ExistingFormPreview
									key={ form.id }
									form={ form }
									onClick={ () => handleExistingFormSelect( form ) }
								/>
							) ) }
						</div>
					) }
				</Modal>
			) }
		</div>
	);
}
