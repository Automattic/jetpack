import { SocialServiceIcon } from '@automattic/jetpack-components';
import { __, _x } from '@wordpress/i18n';
import React, { useMemo } from 'react';
import BlueskyPreview from './bluesky';
import FacebookPreview from './facebook';
import GoogleSearch from './google-search';
import { LinkedIn } from './linkedin';
import MastodonPreview from './mastodon';
import { Nextdoor } from './nextdoor';
import { Threads } from './threads';
import TumblrPreview from './tumblr';
import Twitter from './twitter';

/**
 * Returns the list of available services.
 *
 * @return {Array<{title: string, icon: React.Component, name: string, preview: React.Component}>} The list of available services.
 */
export function useAvailableSerivces() {
	return useMemo(
		() =>
			[
				{
					title: __( 'Google Search', 'jetpack-publicize-components' ),
					icon: props => <SocialServiceIcon serviceName="google" { ...props } />,
					name: 'google',
					preview: GoogleSearch,
				},
				{
					title: __( 'X', 'jetpack-publicize-components' ),
					icon: props => <SocialServiceIcon serviceName="x" { ...props } />,
					name: 'x',
					preview: Twitter,
				},
				{
					title: __( 'Facebook', 'jetpack-publicize-components' ),
					icon: props => <SocialServiceIcon serviceName="facebook" { ...props } />,
					name: 'facebook',
					preview: FacebookPreview,
				},
				{
					title: _x(
						'Threads',
						'The name of the social media network - threads.net',
						'jetpack-publicize-components'
					),
					icon: props => <SocialServiceIcon serviceName="threads" { ...props } />,
					name: 'threads',
					preview: Threads,
				},
				{
					title: __( 'LinkedIn', 'jetpack-publicize-components' ),
					icon: props => <SocialServiceIcon serviceName="linkedin" { ...props } />,
					name: 'linkedin',
					preview: LinkedIn,
				},
				{
					title: __( 'Nextdoor', 'jetpack-publicize-components' ),
					icon: props => <SocialServiceIcon serviceName="nextdoor" { ...props } />,
					name: 'nextdoor',
					preview: Nextdoor,
				},
				{
					title: __( 'Tumblr', 'jetpack-publicize-components' ),
					icon: props => <SocialServiceIcon serviceName="tumblr-alt" { ...props } />,
					name: 'tumblr',
					preview: TumblrPreview,
				},
				{
					title: __( 'Mastodon', 'jetpack-publicize-components' ),
					icon: props => <SocialServiceIcon serviceName="mastodon" { ...props } />,
					name: 'mastodon',
					preview: MastodonPreview,
				},
				{
					title: __( 'Bluesky', 'jetpack-publicize-components' ),
					icon: props => <SocialServiceIcon serviceName="bluesky" { ...props } />,
					name: 'bluesky',
					preview: BlueskyPreview,
				},
			].filter( Boolean ),
		[]
	);
}
