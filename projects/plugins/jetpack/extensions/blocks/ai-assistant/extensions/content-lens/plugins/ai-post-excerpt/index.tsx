/**
 * External dependencies
 */
import { aiAssistantIcon, useAiSuggestions } from '@automattic/jetpack-ai-client';
import { TextareaControl, ExternalLink, Button, Notice } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { useEffect, useState } from '@wordpress/element';
import { __, sprintf, _n } from '@wordpress/i18n';
import { count } from '@wordpress/wordcount';
/**
 * Internal dependencies
 */
import './style.scss';
import { AiExcerptControl } from '../../components/ai-excerpt-control';
/**
 * Types and constants
 */
type ContentLensMessageContextProps = {
	type: 'ai-content-lens';
	contentType: 'post-excerpt';
	postId: number;
	words?: number;
};

function AiPostExcerpt() {
	const excerpt = useSelect(
		select => select( 'core/editor' ).getEditedPostAttribute( 'excerpt' ),
		[]
	);

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
	 */
	function requestExcerpt() {
		// Reset suggestion state
		reset();

		const messageContext: ContentLensMessageContextProps = {
			type: 'ai-content-lens',
			contentType: 'post-excerpt',
			words: excerptWordsNumber,
			postId,
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

			{ error?.code && error.code !== 'error_quota_exceeded' && (
				<Notice
					status={ error.severity }
					isDismissible={ false }
					className="jetpack-ai-assistant__error"
				>
					{ error.message }
				</Notice>
			) }

			<AiExcerptControl
				words={ excerptWordsNumber }
				onWordsNumberChange={ setExcerptWordsNumber }
				disabled={ isBusy }
			/>

			<div className="jetpack-generated-excerpt__generate-buttons-container">
				<Button
					onClick={ discardExpert }
					variant="secondary"
					isDestructive
					disabled={ requestingState !== 'done' }
				>
					{ __( 'Discard', 'jetpack' ) }
				</Button>

				<Button onClick={ setExpert } variant="secondary" disabled={ requestingState !== 'done' }>
					{ __( 'Accept', 'jetpack' ) }
				</Button>

				<Button
					onClick={ () => requestExcerpt() }
					variant="secondary"
					isBusy={ isBusy }
					disabled={ isGenerateButtonDisabled }
				>
					{ __( 'Generate', 'jetpack' ) }
				</Button>
			</div>

			<ExternalLink
				href={ __(
					'https://wordpress.org/documentation/article/page-post-settings-sidebar/#excerpt',
					'jetpack'
				) }
			>
				{ __( 'Learn more about manual excerpts', 'jetpack' ) }
			</ExternalLink>
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
