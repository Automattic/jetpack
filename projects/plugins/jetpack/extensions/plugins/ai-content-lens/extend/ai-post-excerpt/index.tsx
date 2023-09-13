/**
 * External dependencies
 */
import {
	ERROR_QUOTA_EXCEEDED,
	aiAssistantIcon,
	useAiSuggestions,
} from '@automattic/jetpack-ai-client';
import { TextareaControl, ExternalLink, Button, Notice } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { useState, useEffect } from '@wordpress/element';
import { __, sprintf, _n } from '@wordpress/i18n';
import { count } from '@wordpress/wordcount';
import React from 'react';
/**
 * Internal dependencies
 */
import './style.scss';
import UpgradePrompt from '../../../../blocks/ai-assistant/components/upgrade-prompt';
import useAutosaveAndRedirect from '../../../../shared/use-autosave-and-redirect';
import { AiExcerptControl } from '../../components/ai-excerpt-control';
/**
 * Types and constants
 */
type ContentLensMessageContextProps = {
	type: 'ai-content-lens';
	contentType: 'post-excerpt';
	postId: number;
	content?: string;
	words?: number;
};

function AiPostExcerpt() {
	const excerpt = useSelect(
		select => select( 'core/editor' ).getEditedPostAttribute( 'excerpt' ),
		[]
	);

	// Use the hook only to get the autosave function. It won't be used for redirect.
	const { autosave } = useAutosaveAndRedirect();

	const postId = useSelect( select => select( 'core/editor' ).getCurrentPostId(), [] );
	const { editPost } = useDispatch( 'core/editor' );

	// Post excerpt words number
	const [ excerptWordsNumber, setExcerptWordsNumber ] = useState( 50 );

	// Re enable the AI Excerpt component
	const [ reenable, setReenable ] = useState( false );

	const { request, stopSuggestion, suggestion, requestingState, error, reset } = useAiSuggestions(
		{}
	);

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
			const content = select( 'core/editor' ).getEditedPostContent();
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
	 * @param {React.MouseEvent} ev - The click event.
	 * @returns {void}
	 */
	async function requestExcerpt( ev: React.MouseEvent ): Promise< void > {
		await autosave( ev );

		// Enable Generate button
		setReenable( false );

		// Reset suggestion state
		reset();

		const messageContext: ContentLensMessageContextProps = {
			type: 'ai-content-lens',
			contentType: 'post-excerpt',
			postId,
			words: excerptWordsNumber,
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

		request( prompt, { feature: 'jetpack-ai-content-lens' } );
	}

	function setExpert() {
		editPost( { excerpt: suggestion } );
		reset();
	}

	function discardExpert() {
		editPost( { excerpt: excerpt } );
		reset();
	}

	const isQuotaExceeded = error?.code === ERROR_QUOTA_EXCEEDED;

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

			<ExternalLink
				href={ __(
					'https://wordpress.org/documentation/article/page-post-settings-sidebar/#excerpt',
					'jetpack'
				) }
			>
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

				{ isQuotaExceeded && <UpgradePrompt /> }

				<AiExcerptControl
					words={ excerptWordsNumber }
					onWordsNumberChange={ wordsNumber => {
						setExcerptWordsNumber( wordsNumber );
						setReenable( true );
					} }
					disabled={ isBusy || isQuotaExceeded }
				/>

				<div className="jetpack-generated-excerpt__generate-buttons-container">
					<Button
						onClick={ discardExpert }
						variant="secondary"
						isDestructive
						disabled={ requestingState !== 'done' || isQuotaExceeded }
					>
						{ __( 'Discard', 'jetpack' ) }
					</Button>

					<Button
						onClick={ setExpert }
						variant="secondary"
						disabled={ requestingState !== 'done' || isQuotaExceeded }
					>
						{ __( 'Accept', 'jetpack' ) }
					</Button>

					<Button
						onClick={ requestExcerpt }
						variant="secondary"
						isBusy={ isBusy }
						disabled={ isGenerateButtonDisabled || isQuotaExceeded }
					>
						{ __( 'Generate', 'jetpack' ) }
					</Button>
				</div>
			</div>
		</div>
	);
}

export const PluginDocumentSettingPanelAiExcerpt = () => (
	<PluginDocumentSettingPanel
		name="ai-driven-excerpt"
		title={ __( 'Excerpt', 'jetpack' ) }
		icon={ aiAssistantIcon }
	>
		<AiPostExcerpt />
	</PluginDocumentSettingPanel>
);
