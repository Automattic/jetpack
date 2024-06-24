import { SocialServiceIcon } from '@automattic/jetpack-components';
import { __, _x } from '@wordpress/i18n';
import React, { useMemo } from 'react';
import {
	CONNECTION_SERVICE_INSTAGRAM_BUSINESS,
	CONNECTION_SERVICE_MASTODON,
	CONNECTION_SERVICE_NEXTDOOR,
	CONNECTION_SERVICE_THREADS,
} from '../../social-store';
import { getSupportedAdditionalConnections } from '../../utils';
import FacebookPreview from './facebook';
import GoogleSearch from './google-search';
import { Instagram } from './instagram';
import { LinkedIn } from './linkedin';
import MastodonPreview from './mastodon';
import { Nextdoor } from './nextdoor';
import { Threads } from './threads';
import TumblrPreview from './tumblr';
import Twitter from './twitter';

/**
 * Returns the list of available services.
 *
 * @returns {Array<{title: string, icon: React.Component, name: string, preview: React.Component}>} The list of available services.
 */
export function useAvailableSerivces() {
	const additionalConnections = getSupportedAdditionalConnections();
	const isInstagramSupported = additionalConnections.includes(
		CONNECTION_SERVICE_INSTAGRAM_BUSINESS
	);
	const isMastodonSupported = additionalConnections.includes( CONNECTION_SERVICE_MASTODON );
	const isNextdoorSupported = additionalConnections.includes( CONNECTION_SERVICE_NEXTDOOR );
	const isThreadsSupported = additionalConnections.includes( CONNECTION_SERVICE_THREADS );

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
					title: __( 'X', 'jetpack' ),
					icon: props => <SocialServiceIcon serviceName="x" { ...props } />,
					name: 'x',
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
				isThreadsSupported
					? {
							title: _x(
								'Threads',
								'The name of the social media network - threads.net',
								'jetpack'
							),
							icon: props => <SocialServiceIcon serviceName="threads" { ...props } />,
							name: 'threads',
							preview: Threads,
					  }
					: null,
				{
					title: __( 'LinkedIn', 'jetpack' ),
					icon: props => <SocialServiceIcon serviceName="linkedin" { ...props } />,
					name: 'linkedin',
					preview: LinkedIn,
				},
				isNextdoorSupported
					? {
							title: __( 'Nextdoor', 'jetpack' ),
							icon: props => <SocialServiceIcon serviceName="nextdoor" { ...props } />,
							name: 'nextdoor',
							preview: Nextdoor,
					  }
					: null,
				{
					title: __( 'Tumblr', 'jetpack' ),
					icon: props => <SocialServiceIcon serviceName="tumblr-alt" { ...props } />,
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
		[ isInstagramSupported, isMastodonSupported, isNextdoorSupported, isThreadsSupported ]
	);
}
