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
import { useEffect, useState } from '@wordpress/element';
import { __, sprintf, _n } from '@wordpress/i18n';
import { count } from '@wordpress/wordcount';
import React from 'react';
import TurndownService from 'turndown';
/**
 * Internal dependencies
 */
import './style.scss';
import useAutosaveAndRedirect from '../../../../../../shared/use-autosave-and-redirect';
import UpgradePrompt from '../../../../components/upgrade-prompt';
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

// Turndown instance
const turndownService = new TurndownService();

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

	// Remove core excerpt panel
	const { removeEditorPanel } = useDispatch( 'core/edit-post' );

	const { request, suggestion, requestingState, error, reset } = useAiSuggestions();

	useEffect( () => {
		removeEditorPanel( 'post-excerpt' );
	}, [ removeEditorPanel ] );

	const postContent = useSelect(
		select => {
			const content = select( 'core/editor' ).getEditedPostContent();
			if ( ! content ) {
				return '';
			}

			return turndownService.turndown( content );
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
		requestingState === 'done';
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
					onWordsNumberChange={ setExcerptWordsNumber }
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
