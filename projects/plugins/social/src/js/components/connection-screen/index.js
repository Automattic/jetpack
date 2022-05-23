/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { ConnectScreen } from '@automattic/jetpack-connection';
import React from 'react';

/**
 * Internal dependencies
 */
import { STORE_ID } from '../../store';

const ConnectionScreen = () => {
	const connectProps = useSelect( select => {
		const store = select( STORE_ID );
		return {
			apiRoot: store.getAPIRootUrl(),
			apiNonce: store.getAPINonce(),
			registrationNonce: store.getRegistrationNonce(),
		};
	} );
	return (
		<ConnectScreen
			buttonLabel={ __( 'Connect Jetpack Social', 'jetpack-social' ) }
			pricingTitle={ __( 'Jetpack Social', 'jetpack-social' ) }
			title={ __( 'Social Media Automation for WordPress Sites', 'jetpack-social' ) }
			from="jetpack-social"
			redirectUri="admin.php?page=jetpack-social"
			{ ...connectProps }
		>
			<h3>
				{ __(
					'Share your site’s posts on several social media networks automatically when you publish a new post',
					'jetpack-social'
				) }
			</h3>
			<ul>
				<li>
					{ __(
						'Reach your maximum potential audience, not just those who visit your site',
						'jetpack-social'
					) }
				</li>
				<li>
					{ __(
						'Be found by prospective readers or customers on their preferred social site or network',
						'jetpack-social'
					) }
				</li>
				<li>
					{ __(
						'Allow people who like your content to easily share it with their own followers, giving you even greater visibility',
						'jetpack-social'
					) }
				</li>
			</ul>
		</ConnectScreen>
	);
};

export default ConnectionScreen;
