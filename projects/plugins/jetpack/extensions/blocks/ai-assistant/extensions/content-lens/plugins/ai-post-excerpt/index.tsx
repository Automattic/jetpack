/**
 * External dependencies
 */
import { aiAssistantIcon } from '@automattic/jetpack-ai-client';
import { TextareaControl, ExternalLink } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import './style.scss';

function AiPostExcerpt() {
	const excerpt = useSelect(
		select => select( 'core/editor' ).getEditedPostAttribute( 'excerpt' ),
		[]
	);
	const { editPost } = useDispatch( 'core/editor' );

	// Remove core excerpt panel
	const { removeEditorPanel } = useDispatch( 'core/edit-post' );
	useEffect( () => {
		removeEditorPanel( 'post-excerpt' );
	}, [ removeEditorPanel ] );

	return (
		<div className="jetpack-ai-post-excerpt">
			<TextareaControl
				__nextHasNoMarginBottom
				label={ __( 'Write an excerpt (optional)', 'jetpack' ) }
				onChange={ value => editPost( { excerpt: value } ) }
				value={ excerpt }
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
