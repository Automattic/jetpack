/**
 * External dependencies
 */
import { AIControl } from '@automattic/jetpack-ai-client';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { useBlockProps, store as blockEditorStore } from '@wordpress/block-editor';
import { rawHandler } from '@wordpress/blocks';
import { SandBox } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useRef, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import MarkdownIt from 'markdown-it';
import { View } from 'react-native';
/**
 * Internal dependencies
 */
import ToolbarControls from './components/toolbar-controls';
import style from './editor.native.scss';
import useAIFeature from './hooks/use-ai-feature';
import useSuggestionsFromOpenAI from './hooks/use-suggestions-from-openai';
import { isUserConnected } from './lib/connection';

const markdownConverter = new MarkdownIt( {
	breaks: true,
} );

const CONTENT_STYLE = `
.jetpack-ai-content {
  overflow-x: auto;
  font-family: sans-serif;
  font-size: 1em;
  line-height: 1.6;
}
.jetpack-ai-content table {
  border-collapse: collapse;
  width: 100%;
}
.jetpack-ai-content thead {
  border-bottom: 3px solid;
}
.jetpack-ai-content tfoot {
  border-top: 3px solid;
}
.jetpack-ai-content td,
.jetpack-ai-content th {
  border: 1px solid;
  padding: 0.5em;
}
.jetpack-ai-content .has-fixed-layout {
  table-layout: fixed;
  width: 100%;
}
.jetpack-ai-content .has-fixed-layout td,
.jetpack-ai-content .has-fixed-layout th {
  word-break: break-word;
}
.jetpack-ai-content.alignleft,
.jetpack-ai-content.aligncenter,
.jetpack-ai-content.alignright {
  display: table;
  width: auto;
}
.jetpack-ai-content.alignleft td,
.jetpack-ai-content.aligncenter td,
.jetpack-ai-content.alignright td,
.jetpack-ai-content.alignleft th,
.jetpack-ai-content.aligncenter th,
.jetpack-ai-content.alignright th {
  word-break: break-word;
}
.jetpack-ai-content .has-border-color > *,
.jetpack-ai-content .has-border-color tr,
.jetpack-ai-content .has-border-color th,
.jetpack-ai-content .has-border-color td {
  border-color: inherit;
}
.jetpack-ai-content table[style*="border-top-color"] > *,
.jetpack-ai-content table[style*="border-top-color"] tr:first-child {
  border-top-color: inherit;
}
.jetpack-ai-content table[style*="border-top-color"] > * th,
.jetpack-ai-content table[style*="border-top-color"] tr:first-child th,
.jetpack-ai-content table[style*="border-top-color"] > * td,
.jetpack-ai-content table[style*="border-top-color"] tr:first-child td {
  border-top-color: inherit;
}
.jetpack-ai-content table[style*="border-top-color"] tr:not(:first-child) {
  border-top-color: currentColor;
}
.jetpack-ai-content table[style*="border-right-color"] > *,
.jetpack-ai-content table[style*="border-right-color"] tr,
.jetpack-ai-content table[style*="border-right-color"] th,
.jetpack-ai-content table[style*="border-right-color"] td:last-child {
  border-right-color: inherit;
}
.jetpack-ai-content table[style*="border-bottom-color"] > *,
.jetpack-ai-content table[style*="border-bottom-color"] tr:last-child {
  border-bottom-color: inherit;
}
.jetpack-ai-content table[style*="border-bottom-color"] > * th,
.jetpack-ai-content table[style*="border-bottom-color"] tr:last-child th,
.jetpack-ai-content table[style*="border-bottom-color"] > * td,
.jetpack-ai-content table[style*="border-bottom-color"] tr:last-child td {
  border-bottom-color: inherit;
}
.jetpack-ai-content table[style*="border-bottom-color"] tr:not(:last-child) {
  border-bottom-color: currentColor;
}
.jetpack-ai-content table[style*="border-left-color"] > *,
.jetpack-ai-content table[style*="border-left-color"] tr,
.jetpack-ai-content table[style*="border-left-color"] th,
.jetpack-ai-content table[style*="border-left-color"] td:first-child {
  border-left-color: inherit;
}
.jetpack-ai-content table[style*="border-style"] > *,
.jetpack-ai-content table[style*="border-style"] tr,
.jetpack-ai-content table[style*="border-style"] th,
.jetpack-ai-content table[style*="border-style"] td {
  border-style: inherit;
}
.jetpack-ai-content table[style*="border-width"] > *,
.jetpack-ai-content table[style*="border-width"] tr,
.jetpack-ai-content table[style*="border-width"] th,
.jetpack-ai-content table[style*="border-width"] td {
  border-width: inherit;
  border-style: inherit;
}
`;

export default function AIAssistantEdit( { attributes, setAttributes, clientId, onFocus } ) {
	const [ userPrompt, setUserPrompt ] = useState();
	const [ errorData, setError ] = useState( {} );
	const [ errorDismissed, setErrorDismissed ] = useState( null );
	const { tracks } = useAnalytics();

	const aiControlRef = useRef( null );
	const blockRef = useRef( null );

	const block = useSelect( select => select( blockEditorStore ).getBlock( clientId ), [
		clientId,
	] );
	const { replaceBlocks, replaceBlock, removeBlock } = useDispatch( 'core/block-editor' );
	const { editPost } = useDispatch( 'core/editor' );

	const { requireUpgrade: requireUpgradeOnStart, refresh: refreshFeatureData } = useAIFeature();
	const requireUpgrade = requireUpgradeOnStart || errorData?.code === 'error_quota_exceeded';
	// const connected = isUserConnected();
	const connected = true;

	const focusOnPrompt = () => {
		// Small delay to avoid focus crash
		setTimeout( () => {
			aiControlRef.current?.focus?.();
		}, 100 );
	};

	const focusOnBlock = () => {
		onFocus();
	};

	const {
		isLoadingCategories,
		isLoadingCompletion,
		getSuggestionFromOpenAI,
		stopSuggestion,
		showRetry,
		contentBefore,
		postTitle,
		retryRequest,
		wholeContent,
		requestingState,
	} = useSuggestionsFromOpenAI( {
		onSuggestionDone: focusOnPrompt,
		onUnclearPrompt: focusOnPrompt,
		onModeration: focusOnPrompt,
		attributes,
		clientId,
		content: attributes.content,
		setError,
		tracks,
		userPrompt,
		refreshFeatureData,
		requireUpgrade,
	} );

	// Content is loaded
	const contentIsLoaded = !! attributes.content;
	const useGutenbergSyntax = attributes?.useGutenbergSyntax;
	const isGeneratingTitle = attributes.promptType === 'generateTitle';
	// Waiting state means there is nothing to be done until it resolves
	const isWaitingState = isLoadingCompletion || isLoadingCategories;
	const acceptContentLabel = __( 'Accept', 'jetpack' );
	const acceptTitleLabel = __( 'Accept title', 'jetpack' );
	const acceptLabel = isGeneratingTitle ? acceptTitleLabel : acceptContentLabel;

	useEffect( () => {
		if ( errorData ) {
			setErrorDismissed( false );
		}
	}, [ errorData ] );

	// Handlers
	const handleGetSuggestion = ( ...args ) => {
		getSuggestionFromOpenAI( ...args );
		focusOnBlock();
		return;
	};

	const handleChange = value => {
		setErrorDismissed( true );
		setUserPrompt( value );
	};

	const handleSend = () => {
		handleGetSuggestion( 'userPrompt' );
	};

	const handleStopSuggestion = () => {
		stopSuggestion();
	};

	const handleAccept = () => {
		if ( isGeneratingTitle ) {
			handleAcceptTitle();
		} else {
			handleAcceptContent();
		}
	};

	const handleTryAgain = () => {
		setAttributes( {
			content: attributes?.originalContent,
			promptType: undefined,
			messages: attributes?.originalMessages,
		} );
	};

	const handleAcceptContent = async () => {
		let newGeneratedBlocks = [];
		if ( ! useGutenbergSyntax ) {
			/*
			 * Markdown-syntax content
			 * - Get HTML code from markdown content
			 * - Create blocks from HTML code
			 */
			const HTML = markdownConverter
				.render( attributes.content )
				// Fix list indentation
				.replace( /<li>\s+<p>/g, '<li>' )
				.replace( /<\/p>\s+<\/li>/g, '</li>' );
			newGeneratedBlocks = rawHandler( {
				HTML: HTML,
			} );
		} else {
			/*
			 * Gutenberg-syntax content
			 * - Blocks are already created
			 * - blocks are children of the current block
			 */
			newGeneratedBlocks = block;
			newGeneratedBlocks = newGeneratedBlocks?.innerBlocks || [];
		}

		// Replace the block with the new generated blocks
		await replaceBlocks( clientId, newGeneratedBlocks );

		// Move the caret to the end of the last editable element
		// TODO: Explore how to do this on mobile without document querying.
		// const lastEditableElement = getLastEditableElement( newGeneratedBlocks );
		// if ( lastEditableElement ) {
		// 	moveCaretToEnd( lastEditableElement );
		// }
	};

	const handleAcceptTitle = () => {
		editPost( { title: attributes.content.trim() } );
		removeBlock( clientId );
	};

	const handleImageRequest = () => {
		// setResultImages( [] );
		// setError( {} );
		// getImagesFromOpenAI(
		// 	userPrompt.trim() === '' ? __( 'What would you like to see?', 'jetpack' ) : userPrompt,
		// 	setAttributes,
		// 	setLoadingImages,
		// 	setResultImages,
		// 	setError,
		// 	postId
		// );
		// tracks.recordEvent( 'jetpack_ai_dalle_generation', {
		// 	post_id: postId,
		// } );
	};

	const blockProps = useBlockProps( {
		ref: blockRef,
	} );

	return (
		<View { ...blockProps }>
			{ contentIsLoaded && ! useGutenbergSyntax && (
				<View style={ style[ 'ai-assistant__content' ] }>
					<SandBox
						styles={ [ CONTENT_STYLE ] }
						html={ `<div class="jetpack-ai-content">${ markdownConverter.render(
							attributes.content
						) }</div>` }
					/>
				</View>
			) }
			{ ! isWaitingState && connected && ! requireUpgrade && (
				<ToolbarControls
					isWaitingState={ isWaitingState }
					contentIsLoaded={ contentIsLoaded }
					getSuggestionFromOpenAI={ getSuggestionFromOpenAI }
					retryRequest={ retryRequest }
					handleAcceptContent={ handleAcceptContent }
					handleAcceptTitle={ handleAcceptTitle }
					handleGetSuggestion={ handleGetSuggestion }
					handleImageRequest={ handleImageRequest }
					handleTryAgain={ handleTryAgain }
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

						// Add a typing effect in the text area
						for ( let i = 0; i < prompt.length; i++ ) {
							setTimeout( () => {
								setUserPrompt( prompt.slice( 0, i + 1 ) );
							}, 25 * i );
						}
					} }
					recordEvent={ tracks.recordEvent }
					isGeneratingTitle={ isGeneratingTitle }
				/>
			) }
			<AIControl
				ref={ aiControlRef }
				disabled={ requireUpgrade }
				value={ userPrompt }
				placeholder={ __( 'Ask Jetpack AI', 'jetpack' ) }
				onChange={ handleChange }
				onSend={ handleSend }
				onStop={ handleStopSuggestion }
				onAccept={ handleAccept }
				state={ requestingState }
				isTransparent={ requireUpgrade }
				showButtonLabels={ true }
				showAccept={ contentIsLoaded && ! isWaitingState }
				acceptLabel={ acceptLabel }
				showClearButton={ ! isWaitingState }
				onFocus={ onFocus }
			/>
		</View>
	);
}
