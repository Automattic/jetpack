/**
 * External dependencies
 */
import { aiAssistantIcon, useAiSuggestions } from '@automattic/jetpack-ai-client';
import { TextareaControl, ExternalLink } from '@wordpress/components';
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

function AiPostExcerpt() {
	const excerpt = useSelect(
		select => select( 'core/editor' ).getEditedPostAttribute( 'excerpt' ),
		[]
	);

<<<<<<< HEAD
=======
	const postId = useSelect( select => select( 'core/editor' ).getCurrentPostId(), [] );
>>>>>>> a5796b31ff ([not verified] start to request suggestion)
	const { editPost } = useDispatch( 'core/editor' );

	// Post excerpt words number
	const [ excerptWordsNumber, setExcerptWordsNumber ] = useState( 50 );

	// Remove core excerpt panel
	const { removeEditorPanel } = useDispatch( 'core/edit-post' );

<<<<<<< HEAD
=======
	const { request, suggestion } = useAiSuggestions();

>>>>>>> a5796b31ff ([not verified] start to request suggestion)
	useEffect( () => {
		removeEditorPanel( 'post-excerpt' );
	}, [ removeEditorPanel ] );

	function updatePostExcerpt() {
		console.log( 'request excerpt suggestion' ); // eslint-disable-line no-console
	}

	// Show custom prompt number of words
	const numberOfWords = count( excerpt, 'words' );
	const helpNumberOfWords = sprintf(
		// Translators: %1$s is the number of words in the excerpt.
		_n( '%1$s word', '%1$s words', numberOfWords, 'jetpack' ),
		numberOfWords
	);

<<<<<<< HEAD
=======
	function updatePostExcerpt() {
		const prompt = [
			{
				role: 'jetpack-ai',
				context: {
					type: 'ai-content-lens',
					request: 'excerpt',
					words: excerptWordsNumber,
					postId,
				},
			},
		];

		request( prompt );
	}

>>>>>>> a5796b31ff ([not verified] start to request suggestion)
	return (
		<div className="jetpack-ai-post-excerpt">
			<TextareaControl
				__nextHasNoMarginBottom
				label={ __( 'Write an excerpt (optional)', 'jetpack' ) }
				onChange={ value => editPost( { excerpt: value } ) }
				value={ excerpt || suggestion }
				help={ numberOfWords ? helpNumberOfWords : null }
			/>

			<AiExcerptControl
				words={ excerptWordsNumber }
				onWordsNumberChange={ setExcerptWordsNumber }
				onGenerate={ updatePostExcerpt }
			/>

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
