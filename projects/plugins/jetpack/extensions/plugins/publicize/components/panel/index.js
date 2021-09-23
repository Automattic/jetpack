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
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PublicizeConnectionVerify from '../connection-verify';
import PublicizeForm from '../form';
import PublicizeTwitterOptions from '../twitter/options';
import useSelectSocialMediaConnections from '../../hooks/use-social-media-connections';
import usePostJustSaved from '../../hooks/use-post-just-saved';

const PublicizePanel = ( { prePublish } ) => {
	const { refresh, hasEnabledConnections } = useSelectSocialMediaConnections();

	// Refresh connections when the post is just saved.
	usePostJustSaved(
		function () {
			if ( ! hasEnabledConnections ) {
				return;
			}

			refresh();
		},
		[ hasEnabledConnections, refresh ]
	);

	return (
		<Fragment>
			<PublicizeConnectionVerify />

			<div>
				{ __( "Connect and select the accounts where you'd like to share your post.", 'jetpack' ) }
			</div>

			<PublicizeForm />

			<PublicizeTwitterOptions prePublish={ prePublish } />
		</Fragment>
	);
};

export default PublicizePanel;
