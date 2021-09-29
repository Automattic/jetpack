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
import { PanelBody } from '@wordpress/components';

/**
 * Internal dependencies
 */
import PublicizeConnectionVerify from '../connection-verify';
import PublicizeForm from '../form';
import PublicizeTwitterOptions from '../twitter/options';
import useSelectSocialMediaConnections from '../../hooks/use-social-media-connections';
import { usePostJustBeforePublish } from '../../hooks/use-saving-post';

const PublicizePanel = ( { prePublish } ) => {
	const { refresh, connections } = useSelectSocialMediaConnections();

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

	return (
		<PanelBody title={ __( 'Share this post', 'jetpack' ) }>
			<PublicizeConnectionVerify />
			<PublicizeForm />
			<PublicizeTwitterOptions prePublish={ prePublish } />
		</PanelBody>
	);
};

export default PublicizePanel;
