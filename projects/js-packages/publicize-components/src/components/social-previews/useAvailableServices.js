import { SocialServiceIcon } from '@automattic/jetpack-components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import React, { useMemo } from 'react';
import FacebookPreview from './facebook';
import GoogleSearch from './google-search';
import { Instagram } from './instagram';
import { LinkedIn } from './linkedin';
import MastodonPreview from './mastodon';
import TumblrPreview from './tumblr';
import Twitter from './twitter';

/**
 * Returns the list of available services.
 *
 * @returns {Array<{title: string, icon: React.Component, name: string, preview: React.Component}>} The list of available services.
 */
export function useAvailableSerivces() {
	const { isInstagramSupported, isMastodonSupported } = useSelect( select => {
		const store = select( 'jetpack/publicize' );

		return {
			isInstagramSupported: store.isInstagramConnectionSupported(),
			isMastodonSupported: store.isMastodonConnectionSupported(),
		};
	} );

	return useMemo(
		() =>
			[
				{
					title: __( 'Google Search', 'jetpack' ),
					icon: props => <SocialServiceIcon serviceName="google" { ...props } />,
					name: 'google',
					preview: GoogleSearch,
				},
				{
					title: __( 'Twitter', 'jetpack' ),
					icon: props => <SocialServiceIcon serviceName="twitter" { ...props } />,
					name: 'twitter',
					preview: Twitter,
				},
				{
					title: __( 'Facebook', 'jetpack' ),
					icon: props => <SocialServiceIcon serviceName="facebook" { ...props } />,
					name: 'facebook',
					preview: FacebookPreview,
				},
				isInstagramSupported
					? {
							title: __( 'Instagram', 'jetpack' ),
							icon: props => <SocialServiceIcon serviceName="instagram" { ...props } />,
							name: 'instagram',
							preview: Instagram,
					  }
					: null,
				{
					title: __( 'LinkedIn', 'jetpack' ),
					icon: props => <SocialServiceIcon serviceName="linkedin" { ...props } />,
					name: 'linkedin',
					preview: LinkedIn,
				},
				{
					title: __( 'Tumblr', 'jetpack' ),
					icon: props => <SocialServiceIcon serviceName="tumblr" { ...props } />,
					name: 'tumblr',
					preview: TumblrPreview,
				},
				isMastodonSupported
					? {
							title: __( 'Mastodon', 'jetpack' ),
							icon: props => <SocialServiceIcon serviceName="mastodon" { ...props } />,
							name: 'mastodon',
							preview: MastodonPreview,
					  }
					: null,
			].filter( Boolean ),
		[ isInstagramSupported, isMastodonSupported ]
	);
}
