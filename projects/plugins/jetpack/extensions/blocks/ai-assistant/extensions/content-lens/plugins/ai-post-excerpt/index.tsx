/**
 * External dependencies
 */
import { aiAssistantIcon, useAiSuggestions } from '@automattic/jetpack-ai-client';
import { TextareaControl, ExternalLink } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
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

	const postId = useSelect( select => select( 'core/editor' ).getCurrentPostId(), [] );
	const { editPost } = useDispatch( 'core/editor' );

	// Post excerpt words number
	const [ excerptWordsNumber, setExcerptWordsNumber ] = useState( 50 );

	// Remove core excerpt panel
	const { removeEditorPanel } = useDispatch( 'core/edit-post' );

	const { request, suggestion } = useAiSuggestions();

	useEffect( () => {
		removeEditorPanel( 'post-excerpt' );
	}, [ removeEditorPanel ] );

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

	return (
		<div className="jetpack-ai-post-excerpt">
			<TextareaControl
				__nextHasNoMarginBottom
				label={ __( 'Write an excerpt (optional)', 'jetpack' ) }
				onChange={ value => editPost( { excerpt: value } ) }
				value={ excerpt || suggestion }
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
