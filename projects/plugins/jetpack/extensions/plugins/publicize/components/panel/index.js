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
import { usePostJustPublished } from '../../hooks/use-saving-post';

const PublicizePanel = ( { prePublish } ) => {
	const { refresh, hasEnabledConnections } = useSelectSocialMediaConnections();

	// Refresh connections when the post is just published.
	usePostJustPublished(
		function () {
			if ( ! hasEnabledConnections ) {
				return;
			}

			refresh();
		},
		[ hasEnabledConnections, refresh ]
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
