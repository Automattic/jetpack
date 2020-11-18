/**
 * External dependencies
 */
import { PluginPostPublishPanel } from '@wordpress/edit-post';
import { registerPlugin } from '@wordpress/plugins';
import { __ } from '@wordpress/i18n';

registerPlugin( 'anchor-post-publish', {
	render: () => (
		<PluginPostPublishPanel
			className="my-plugin-post-publish-panel"
			title={ __( 'Convert to audio', 'jetpack' ) }
			initialOpen
		>
			<p>
				{ __(
					'Turn your post into a podcast episode and let your readers listen to your post.',
					'jetpack'
				) }
			</p>
			<p>
				<a href="https://anchor.fm" target="_blank" rel="noreferrer">
					{ __( 'Create a podcast episode', 'jetpack' ) }
				</a>
			</p>
		</PluginPostPublishPanel>
	),
} );
