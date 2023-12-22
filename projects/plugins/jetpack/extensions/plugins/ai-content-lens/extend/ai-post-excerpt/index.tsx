/**
 * External dependencies
 */
import { AI_MODEL_GPT_4, useAiSuggestions } from '@automattic/jetpack-ai-client';
import { isAtomicSite, isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
import { TextareaControl, ExternalLink, Button, Notice, BaseControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { store as editorStore, PostTypeSupportCheck } from '@wordpress/editor';
import { useState, useEffect, useCallback } from '@wordpress/element';
import { __, sprintf, _n } from '@wordpress/i18n';
import { count } from '@wordpress/wordcount';
/**
 * Internal dependencies
 */
import UpgradePrompt from '../../../../blocks/ai-assistant/components/upgrade-prompt';
import useAiFeature from '../../../../blocks/ai-assistant/hooks/use-ai-feature';
import { isBetaExtension } from '../../../../editor';
import { AiExcerptControl } from '../../components/ai-excerpt-control';
/**
 * Types and constants
 */
import type { LanguageProp } from '../../../../blocks/ai-assistant/components/i18n-dropdown-control';
import type { ToneProp } from '../../../../blocks/ai-assistant/components/tone-dropdown-control';
import type { AiModelTypeProp } from '@automattic/jetpack-ai-client';

import './style.scss';

type ContentLensMessageContextProps = {
	type: 'ai-content-lens';
	contentType: 'post-excerpt';
	postId: number;
	words?: number;
	request?: string;
	content?: string;
	language?: LanguageProp;
	tone?: ToneProp;
	model?: AiModelTypeProp;
};

function AiPostExcerpt() {
	const { excerpt, postId } = useSelect( select => {
		const { getEditedPostAttribute, getCurrentPostId } = select( editorStore );

		return {
			excerpt: getEditedPostAttribute( 'excerpt' ) ?? '',
			postId: getCurrentPostId() ?? 0,
		};
	}, [] );

	const { editPost } = useDispatch( 'core/editor' );

	const { dequeueAiAssistantFeatureAyncRequest, increaseAiAssistantRequestsCount } =
		useDispatch( 'wordpress-com/plans' );

	// Post excerpt words number
	const [ excerptWordsNumber, setExcerptWordsNumber ] = useState( 50 );

	const [ reenable, setReenable ] = useState( false );
	const [ language, setLanguage ] = useState< LanguageProp >();
	const [ tone, setTone ] = useState< ToneProp >();
	const [ model, setModel ] = useState< AiModelTypeProp >( AI_MODEL_GPT_4 );

	const { request, stopSuggestion, suggestion, requestingState, error, reset } = useAiSuggestions( {
		onDone: useCallback( () => {
			/*
			 * Increase the AI Suggestion counter.
			 * @todo: move this at store level.
			 */
			increaseAiAssistantRequestsCount();
		}, [ increaseAiAssistantRequestsCount ] ),
		onError: useCallback(
			suggestionError => {
				/*
				 * Incrses AI Suggestion counter
				 * only for valid errors.
				 * @todo: move this at store level.
				 */
				if (
					suggestionError.code === 'error_network' ||
					suggestionError.code === 'error_quota_exceeded'
				) {
					return;
				}

				// Increase the AI Suggestion counter.
				increaseAiAssistantRequestsCount();
			},
			[ increaseAiAssistantRequestsCount ]
		),
	} );

	// Cancel and reset AI suggestion when the component is unmounted
	useEffect( () => {
		return () => {
			stopSuggestion();
			reset();
		};
	}, [ stopSuggestion, reset ] );

	// Pick raw post content
	const postContent = useSelect(
		select => {
			const content = select( editorStore ).getEditedPostContent();
			if ( ! content ) {
				return '';
			}

			// return turndownService.turndown( content );
			const document = new window.DOMParser().parseFromString( content, 'text/html' );

			const documentRawText = document.body.textContent || document.body.innerText || '';

			// Keep only one break line (\n) between blocks.
			return documentRawText.replace( /\n{2,}/g, '\n' ).trim();
		},
		[ postId ]
	);

	// Show custom prompt number of words
	const currentExcerpt = suggestion || excerpt;
	const numberOfWords = count( currentExcerpt, 'words' );
	const helpNumberOfWords = sprintf(
		// Translators: %1$s is the number of words in the excerpt.
		_n( '%1$s word', '%1$s words', numberOfWords, 'jetpack' ),
		numberOfWords
	);

	const isGenerateButtonDisabled =
		requestingState === 'requesting' ||
		requestingState === 'suggesting' ||
		( requestingState === 'done' && ! reenable );

	const isBusy = requestingState === 'requesting' || requestingState === 'suggesting';
	const isTextAreaDisabled = isBusy || requestingState === 'done';

	/**
	 * Request AI for a new excerpt.
	 *
	 * @returns {void}
	 */
	function requestExcerpt(): void {
		// Enable Generate button
		setReenable( false );

		// Reset suggestion state
		reset();

		const messageContext: ContentLensMessageContextProps = {
			type: 'ai-content-lens',
			contentType: 'post-excerpt',
			postId,
			words: excerptWordsNumber,
			language,
			tone,
			content: `Post content:
${ postContent }
`,
		};

		const prompt = [
			{
				role: 'jetpack-ai',
				context: messageContext,
			},
		];

		/*
		 * Always dequeue/cancel the AI Assistant feature async request,
		 * in case there is one pending,
		 * when performing a new AI suggestion request.
		 */
		dequeueAiAssistantFeatureAyncRequest();

		request( prompt, { feature: 'jetpack-ai-content-lens', model } );
	}

	function setExcerpt() {
		editPost( { excerpt: suggestion } );
		reset();
	}

	function discardExcerpt() {
		editPost( { excerpt: excerpt } );
		reset();
	}

	const { requireUpgrade, isOverLimit } = useAiFeature();

	// Set the docs link depending on the site type
	const docsLink =
		isAtomicSite() || isSimpleSite()
			? __( 'https://wordpress.com/support/excerpts/', 'jetpack' )
			: __( 'https://jetpack.com/support/create-better-post-excerpts-with-ai/', 'jetpack' );

	return (
		<div className="jetpack-ai-post-excerpt">
			<TextareaControl
				__nextHasNoMarginBottom
				label={ __( 'Write an excerpt (optional)', 'jetpack' ) }
				onChange={ value => editPost( { excerpt: value } ) }
				help={ numberOfWords ? helpNumberOfWords : null }
				value={ currentExcerpt }
				disabled={ isTextAreaDisabled }
			/>

			<ExternalLink href={ docsLink }>
				{ __( 'Learn more about manual excerpts', 'jetpack' ) }
			</ExternalLink>

			<div className="jetpack-generated-excerpt__ai-container">
				{ error?.code && error.code !== 'error_quota_exceeded' && (
					<Notice
						status={ error.severity }
						isDismissible={ false }
						className="jetpack-ai-assistant__error"
					>
						{ error.message }
					</Notice>
				) }

				{ isOverLimit && <UpgradePrompt /> }

				<AiExcerptControl
					words={ excerptWordsNumber }
					onWordsNumberChange={ wordsNumber => {
						setExcerptWordsNumber( wordsNumber );
						setReenable( true );
					} }
					language={ language }
					onLanguageChange={ newLang => {
						setLanguage( newLang );
						setReenable( true );
					} }
					tone={ tone }
					onToneChange={ newTone => {
						setTone( newTone );
						setReenable( true );
					} }
					model={ model }
					onModelChange={ newModel => {
						setModel( newModel );
						setReenable( true );
					} }
					disabled={ isBusy || requireUpgrade }
				/>

				<BaseControl
					help={
						! postContent?.length ? __( 'Add content to generate an excerpt.', 'jetpack' ) : null
					}
				>
					<div className="jetpack-generated-excerpt__generate-buttons-container">
						<Button
							onClick={ discardExcerpt }
							variant="secondary"
							isDestructive
							disabled={ requestingState !== 'done' || requireUpgrade }
						>
							{ __( 'Discard', 'jetpack' ) }
						</Button>
						<Button
							onClick={ setExcerpt }
							variant="secondary"
							disabled={ requestingState !== 'done' || requireUpgrade }
						>
							{ __( 'Accept', 'jetpack' ) }
						</Button>
						<Button
							onClick={ requestExcerpt }
							variant="secondary"
							isBusy={ isBusy }
							disabled={ isGenerateButtonDisabled || requireUpgrade || ! postContent }
						>
							{ __( 'Generate', 'jetpack' ) }
						</Button>
					</div>
				</BaseControl>
			</div>
		</div>
	);
}

export const PluginDocumentSettingPanelAiExcerpt = () => (
	<PostTypeSupportCheck supportKeys="excerpt">
		<PluginDocumentSettingPanel
			className={ isBetaExtension( 'ai-content-lens' ) ? 'is-beta-extension inset-shadow' : '' }
			name="ai-content-lens-plugin"
			title={ __( 'Excerpt', 'jetpack' ) }
		>
			<AiPostExcerpt />
		</PluginDocumentSettingPanel>
	</PostTypeSupportCheck>
);
