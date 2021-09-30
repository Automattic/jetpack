/**
 * Publicize sharing panel component.
 *
 * Displays Publicize notifications if no
 * services are connected or displays form if
 * services are connected.
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, PanelRow, ToggleControl } from '@wordpress/components';
import { store as editorStore } from '@wordpress/editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PublicizeConnectionVerify from '../connection-verify';
import PublicizeForm from '../form';
import PublicizeTwitterOptions from '../twitter/options';
import useSelectSocialMediaConnections from '../../hooks/use-social-media-connections';
import { usePostJustBeforePublish } from '../../hooks/use-saving-post';
import { SharePostRow } from '../share-post';
import { useSharePostFeature } from '../../hooks/use-share-post';

const PublicizePanel = ( { prePublish } ) => {
	const { refresh, connections, hasEnabledConnections } = useSelectSocialMediaConnections();
	const { isEnabled, toggleEnable } = useSharePostFeature();

	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );
	const hasConnections = !! connections?.length;

	// Refresh connections when the post is just published.
	usePostJustBeforePublish(
		function () {
			/*
			 * Being optimistic, it sets the connections
			 * that are going to be used
			 * to share the post as `done`.
			 * The sharing process is handled by an async action,
			 * in the server-side.
			 */
			const updatedConnections = connections.map( connection => ( {
				...connection,
				done: connection.enabled,
				toggleable: ! connection.enabled,
			} ) );

			refresh( updatedConnections );
		},
		[ refresh ]
	);

	let mainMessage = __(
		'Start sharing your posts automatically by connecting your social media accounts.',
		'jetpack'
	);
	if ( hasConnections && ( ! isEnabled || ! hasEnabledConnections ) ) {
		mainMessage = __(
			'Use this tool to automatically share your post on all your social media accounts.',
			'jetpack'
		);
	} else if ( isEnabled && hasEnabledConnections ) {
		mainMessage = __(
			'This post will be shared on all your connected and enabled social media the moment you publish the post.',
			'jetpack'
		);
	}

	return (
		<PanelBody title={ __( 'Share this post', 'jetpack' ) }>
			<PanelRow>
				<ToggleControl
					label={
						isEnabled
							? __( 'Sharing is enabled', 'jetpack' )
							: __( 'Sharing is disabled', 'jetpack' )
					}
					onChange={ toggleEnable }
					checked={ isEnabled }
					disabled={ ! hasConnections }
				/>
			</PanelRow>

			<p>{ mainMessage }</p>

			<PublicizeConnectionVerify />
			<PublicizeForm isPublicizeEnabled={ isEnabled } />
			<PublicizeTwitterOptions prePublish={ prePublish } />
			<SharePostRow isEnabled={ isPostPublished && isEnabled } />
		</PanelBody>
	);
};

export default PublicizePanel;
