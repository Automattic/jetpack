/**
 * External dependencies
 */
import { castArray } from 'lodash';

/**
 * WordPress dependencies
 */
import { dispatch } from '@wordpress/data';
import { PluginPostPublishPanel } from '@wordpress/edit-post';
import { external, Icon } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { registerPlugin } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import { waitForEditor } from '../../shared/wait-for-editor';

/**
 * Style dependencies
 */
import './editor.scss';

async function setEpisodeTitle( { title } ) {
	if ( ! title ) {
		return;
	}
	await waitForEditor();
	dispatch( 'core/editor' ).editPost( { title } );
}

const ConvertToAudio = () => (
	<PluginPostPublishPanel className="anchor-post-publish-outbound-link">
		<p className="post-publish-panel__postpublish-subheader">
			<strong>{ __( 'Convert to audio', 'jetpack' ) }</strong>
		</p>
		<p>{ __( 'Let your readers listen to your post.', 'jetpack' ) }</p>
		<p>
			<a href="https://anchor.fm/wordpress" target="_top">
				{ __( 'Create a podcast episode', 'jetpack' ) }
				<Icon icon={ external } className="anchor-post-publish-outbound-link__external_icon" />
			</a>
		</p>
	</PluginPostPublishPanel>
);

function showPostPublishOutboundLink() {
	registerPlugin( 'anchor-post-publish-outbound-link', {
		render: ConvertToAudio,
	} );
}

function initAnchor() {
	const data = window.Jetpack_AnchorFm;
	if ( typeof data !== 'object' ) {
		return;
	}

	data.actions.forEach( action => {
		const [ actionName, actionParams ] = castArray( action );
		switch ( actionName ) {
			case 'show-post-publish-outbound-link':
				showPostPublishOutboundLink();
				break;
			case 'set-episode-title':
				setEpisodeTitle( actionParams );
				break;
		}
	} );
}

initAnchor();
