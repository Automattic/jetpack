/**
 * External dependencies
 */
import {
	BlockAIControl,
	UpgradeMessage,
	renderHTMLFromMarkdown,
} from '@automattic/jetpack-ai-client';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { rawHandler } from '@wordpress/blocks';
import { Notice, PanelBody, PanelRow, KeyboardShortcuts } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';
import { RawHTML, useState, useCallback, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import UsagePanel from '../../plugins/ai-assistant-plugin/components/usage-panel';
import { USAGE_PANEL_PLACEMENT_BLOCK_SETTINGS_SIDEBAR } from '../../plugins/ai-assistant-plugin/components/usage-panel/types';
import { PLAN_TYPE_FREE, usePlanType } from '../../shared/use-plan-type';
import ConnectPrompt from './components/connect-prompt';
import FeedbackControl from './components/feedback-control';
import ToolbarControls from './components/toolbar-controls';
import UpgradePrompt from './components/upgrade-prompt';
import { getStoreBlockId } from './extensions/ai-assistant/with-ai-assistant';
import useAIAssistant from './hooks/use-ai-assistant';
import useAICheckout from './hooks/use-ai-checkout';
import useAiFeature from './hooks/use-ai-feature';
import { isUserConnected } from './lib/connection';
import './editor.scss';

const isInBlockEditor = window?.Jetpack_Editor_Initial_State?.screenBase === 'post';

export default function AIAssistantEdit( { attributes, setAttributes, clientId, isSelected } ) {
	const [ errorDismissed, setErrorDismissed ] = useState( null );
	const { tracks } = useAnalytics();

	const { getBlock } = useSelect( 'core/block-editor' );

	const aiControlRef = useRef( null );
	const blockRef = useRef( null );

	const { replaceBlocks, removeBlock } = useDispatch( 'core/block-editor' );
	const { editPost } = useDispatch( 'core/editor' );

	const {
		isOverLimit,
		requireUpgrade,
		increaseRequestsCount,
		requestsCount,
		requestsLimit,
		currentTier,
		loading: loadingAiFeature,
	} = useAiFeature();
	const requestsRemaining = Math.max( requestsLimit - requestsCount, 0 );

	const { autosaveAndRedirect } = useAICheckout();
	const planType = usePlanType( currentTier );

	const focusOnPrompt = () => {
		/*
		 * Increase the AI Suggestion counter.
		 * @todo: move this at store level.
		 */
		// Small delay to avoid focus crash
		setTimeout( () => {
			aiControlRef.current?.focus?.();
		}, 100 );
	};

	const focusOnBlock = () => {
		// Small delay to avoid focus crash
		setTimeout( () => {
			blockRef.current?.focus?.();
		}, 100 );
	};

	const isMobileViewport = useViewportMatch( 'medium', '<' );

	const contentRef = useRef( null );

	const {
		getSuggestionFromOpenAI,
		stopSuggestion,
		showRetry,
		contentBefore,
		postTitle,
		retryRequest,
		wholeContent,
		requestingState,
		error,
	} = useAIAssistant( {
		onSuggestionDone: useCallback( () => {
			focusOnPrompt();
			increaseRequestsCount();
		}, [ increaseRequestsCount ] ),
		onUnclearPrompt: useCallback( () => {
			focusOnBlock();
			increaseRequestsCount();
		}, [ increaseRequestsCount ] ),
		onModeration: focusOnPrompt,
		attributes,
		clientId,
		content: attributes.content,
		tracks,
		userPrompt: attributes.userPrompt,
		requireUpgrade,
		initialRequestingState: attributes.requestingState,
		contentRef,
		blockRef,
	} );

	const isWaitingResponse = requestingState === 'requesting';
	const isLoadingCompletion = [ 'requesting', 'suggesting' ].includes( requestingState );

	const connected = isUserConnected();

	/*
	 * Auto request the prompt if we detect
	 * it was previously defined in the local storage.
	 */
	const storeBlockId = getStoreBlockId( clientId );
	useEffect( () => {
		if ( ! storeBlockId ) {
			return;
		}

		// Get the parsed data from the local storage.
		const data = JSON.parse( localStorage.getItem( storeBlockId ) );
		if ( ! data ) {
			return;
		}

		const { type, options } = data;

		// Clean up the local storage asap.
		localStorage.removeItem( storeBlockId );

		getSuggestionFromOpenAI( type, options );
	}, [ storeBlockId, getSuggestionFromOpenAI ] );

	useEffect( () => {
		if ( error ) {
			setErrorDismissed( false );
		}
	}, [ error ] );

	useEffect( () => {
		// we don't want to store "half way" states
		if ( ! [ 'init', 'done' ].includes( requestingState ) ) {
			return;
		}

		setAttributes( { requestingState } );
	}, [ requestingState, setAttributes ] );

	// Content is loaded
	const contentIsLoaded = !! attributes.content;

	const getLastEditableElement = newContentBlocks => {
		let lastEditableElement = null;

		newContentBlocks.forEach( block => {
			const element = document.querySelector( `.wp-block[data-block="${ block.clientId }"]` );
			if ( ! element ) {
				return;
			}

			if ( element.contentEditable === 'true' ) {
				lastEditableElement = element;
			}

			const editableChildren = element.querySelectorAll( `[contenteditable=true]` );
			lastEditableElement = editableChildren.length
				? editableChildren[ editableChildren.length - 1 ]
				: lastEditableElement;
		} );

		return lastEditableElement;
	};

	const isGeneratingTitle = attributes.promptType === 'generateTitle';

	const acceptContentLabel = __( 'Accept', 'jetpack' );
	const acceptTitleLabel = __( 'Accept title', 'jetpack' );
	const acceptLabel = isGeneratingTitle ? acceptTitleLabel : acceptContentLabel;

	const moveCaretToEnd = element => {
		const selection = window.getSelection();
		selection.selectAllChildren( element );
		selection.collapseToEnd();
		element.focus();
	};

	const handleGetSuggestion = ( ...args ) => {
		getSuggestionFromOpenAI( ...args );
		focusOnBlock();
		return;
	};

	const handleChange = value => {
		setErrorDismissed( true );
		setAttributes( { userPrompt: value } );
	};

	const handleSend = () => {
		handleGetSuggestion( 'userPrompt' );
		tracks.recordEvent( 'jetpack_ai_assistant_block_generate', { feature: 'ai-assistant' } );
	};

	const handleAccept = () => {
		if ( isGeneratingTitle ) {
			handleAcceptTitle();
		} else {
			handleAcceptContent();
		}
	};

	const replaceContent = async () => {
		let newGeneratedBlocks = [];

		let HTML = renderHTMLFromMarkdown( { content: attributes.content || '' } );

		const seemsToIncludeTitle =
			HTML?.split( '\n' ).length > 1 && HTML?.split( '\n' )?.[ 0 ]?.match( /^<h1>.*<\/h1>$/ );

		if ( seemsToIncludeTitle && ! postTitle ) {
			// split HTML on new line characters
			const htmlLines = HTML.split( '\n' );
			// take the first line as title
			const title = htmlLines.shift();
			// rejoin the rest of the lines on HTML
			HTML = htmlLines.join( '\n' );
			// set the title as post title
			editPost( { title: title.replace( /<[^>]*>/g, '' ) } );
		}
		newGeneratedBlocks = rawHandler( { HTML: HTML } );

		// Replace the block with the new generated blocks
		await replaceBlocks( clientId, newGeneratedBlocks );

		// Move the caret to the end of the last editable element
		const lastEditableElement = getLastEditableElement( newGeneratedBlocks );
		if ( lastEditableElement ) {
			moveCaretToEnd( lastEditableElement );
		}
	};

	const handleAcceptContent = () => {
		replaceContent();
		tracks.recordEvent( 'jetpack_ai_assistant_block_accept', { feature: 'ai-assistant' } );
	};

	const handleAcceptTitle = () => {
		if ( isInBlockEditor ) {
			editPost( { title: attributes.content ? attributes.content.trim() : '' } );
			removeBlock( clientId );
			tracks.recordEvent( 'jetpack_ai_assistant_block_accept', { feature: 'ai-assistant' } );
		} else {
			handleAcceptContent();
		}
	};

	const handleDiscard = () => {
		const isDismiss = attributes?.content === getBlock( clientId ).attributes?.content;
		setAttributes( {
			content: attributes?.originalContent,
			promptType: undefined,
			messages: attributes?.originalMessages,
		} );
		replaceContent();
		if ( isDismiss ) {
			tracks.recordEvent( 'jetpack_ai_assistant_block_dismiss' );
		} else {
			tracks.recordEvent( 'jetpack_ai_assistant_block_discard', { feature: 'ai-assistant' } );
		}
	};

	const handleStopSuggestion = () => {
		stopSuggestion();
		focusOnPrompt();
		tracks.recordEvent( 'jetpack_ai_assistant_block_stop', { feature: 'ai-assistant' } );
	};

	const blockProps = useBlockProps( {
		ref: blockRef,
		className: clsx( { 'is-waiting-response': isWaitingResponse } ),
	} );

	const promptPlaceholder = __( 'Ask Jetpack AI…', 'jetpack' );
	const promptPlaceholderWithSamples = __( 'Write about… Make a table for…', 'jetpack' );

	const banner = (
		<>
			{ isOverLimit && isSelected && <UpgradePrompt placement="ai-assistant-block" /> }
			{ ! connected && <ConnectPrompt /> }
		</>
	);

	const errorNotice = (
		<>
			{ error?.message && ! errorDismissed && error?.code !== 'error_quota_exceeded' && (
				<Notice
					status={ error.status }
					isDismissible={ false }
					className="jetpack-ai-assistant__error"
				>
					{ error.message }
				</Notice>
			) }
		</>
	);

	const trackUpgradeClick = useCallback(
		event => {
			event.preventDefault();
			tracks.recordEvent( 'jetpack_ai_upgrade_button', {
				current_tier_slug: currentTier?.slug,
				requests_count: requestsCount,
				placement: 'jetpack_ai_assistant_block',
			} );
			autosaveAndRedirect( event );
		},
		[ tracks, currentTier, requestsCount, autosaveAndRedirect ]
	);

	return (
		<KeyboardShortcuts
			bindGlobal
			shortcuts={ {
				esc: () => {
					if ( [ 'requesting', 'suggesting' ].includes( requestingState ) ) {
						handleStopSuggestion();
					}
				},
			} }
		>
			<div { ...blockProps }>
				{ contentIsLoaded && (
					<div ref={ contentRef } className="jetpack-ai-assistant__content">
						<RawHTML>{ renderHTMLFromMarkdown( { content: attributes.content || '' } ) }</RawHTML>
					</div>
				) }
				<InspectorControls>
					<PanelBody initialOpen={ true }>
						<PanelRow>
							<UsagePanel placement={ USAGE_PANEL_PLACEMENT_BLOCK_SETTINGS_SIDEBAR } />
						</PanelRow>
					</PanelBody>
					<PanelBody initialOpen={ true }>
						<PanelRow>
							<FeedbackControl />
						</PanelRow>
					</PanelBody>
				</InspectorControls>

				{ ! isLoadingCompletion && connected && ! requireUpgrade && (
					<ToolbarControls
						isWaitingState={ isLoadingCompletion }
						contentIsLoaded={ contentIsLoaded }
						getSuggestionFromOpenAI={ getSuggestionFromOpenAI }
						retryRequest={ retryRequest }
						handleAcceptContent={ handleAcceptContent }
						handleAcceptTitle={ handleAcceptTitle }
						handleTryAgain={ null }
						showRetry={ showRetry }
						contentBefore={ contentBefore }
						hasPostTitle={ !! postTitle?.length }
						wholeContent={ wholeContent }
						promptType={ attributes.promptType }
						setUserPrompt={ prompt => {
							if ( ! aiControlRef?.current ) {
								return;
							}

							const userPromptInput = aiControlRef.current;

							// Focus the text area
							userPromptInput.focus();

							setAttributes( { userPrompt: prompt } );
						} }
						recordEvent={ tracks.recordEvent }
						isGeneratingTitle={ isGeneratingTitle }
					/>
				) }
				<BlockAIControl
					ref={ aiControlRef }
					disabled={ requireUpgrade || ! connected }
					value={ attributes.userPrompt }
					placeholder={ attributes?.content ? promptPlaceholder : promptPlaceholderWithSamples }
					onChange={ handleChange }
					onSend={ handleSend }
					onStop={ handleStopSuggestion }
					onAccept={ handleAccept }
					onDiscard={ handleDiscard }
					state={ requestingState }
					isTransparent={ requireUpgrade || ! connected }
					showButtonLabels={ ! isMobileViewport }
					showAccept={ requestingState !== 'init' && contentIsLoaded && ! isLoadingCompletion }
					acceptLabel={ acceptLabel }
					showGuideLine={ contentIsLoaded }
					showRemove={ attributes?.content?.length > 0 }
					banner={ banner }
					error={ errorNotice }
					customFooter={
						// Only show the upgrade message on each 5th request or if it's the first request - and only if the user is on the free plan
						( requestsRemaining % 5 === 0 || requestsCount === 1 ) &&
						! loadingAiFeature && // Don't show the upgrade message while the feature is loading
						planType === PLAN_TYPE_FREE ? (
							<UpgradeMessage
								requestsRemaining={ requestsRemaining }
								onUpgradeClick={ trackUpgradeClick }
							/>
						) : null
					}
				/>
			</div>
		</KeyboardShortcuts>
	);
}
