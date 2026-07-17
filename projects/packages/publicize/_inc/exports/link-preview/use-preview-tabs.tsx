import {
	BlueskyLinkPreview,
	FacebookLinkPreview,
	GoogleSearchPreview,
	LinkedInLinkPreview,
	MastodonLinkPreview,
	NextdoorLinkPreview,
	ThreadsLinkPreview,
	TumblrLinkPreview,
	TwitterLinkPreview,
} from '@automattic/social-previews';
import { __, _x } from '@wordpress/i18n';
import { useMemo } from 'react';
import { SocialLogo } from 'social-logos';
import { LinkPreviewData, LinkPreviewPlatform } from './types';
import type { TabPanel } from '@wordpress/components';

export type PreviewTab = React.ComponentProps< typeof TabPanel >[ 'tabs' ][ number ] & {
	name: LinkPreviewPlatform;
	preview: React.ComponentType< LinkPreviewData >;
};

/**
 * Returns the list of preview tabs to show in the link previews
 *
 * @return Array of tabs to show in the link previews
 */
export function usePreviewTabs() {
	return useMemo< Array< PreviewTab > >(
		() => [
			{
				title: __( 'Google Search', 'jetpack-publicize-pkg' ),
				icon: <SocialLogo icon="google" />,
				name: 'google',
				preview: GoogleSearchPreview,
			},
			{
				title: __( 'X', 'jetpack-publicize-pkg' ),
				icon: <SocialLogo icon="x" />,
				name: 'x',
				preview: TwitterLinkPreview,
			},
			{
				title: __( 'Facebook', 'jetpack-publicize-pkg' ),
				icon: <SocialLogo icon="facebook" />,
				name: 'facebook',
				preview: FacebookLinkPreview,
			},
			{
				title: _x(
					'Threads',
					'The name of the social media network - threads.net',
					'jetpack-publicize-pkg'
				),
				icon: <SocialLogo icon="threads" />,
				name: 'threads',
				preview: ThreadsLinkPreview,
			},
			{
				title: __( 'LinkedIn', 'jetpack-publicize-pkg' ),
				icon: <SocialLogo icon="linkedin" />,
				name: 'linkedin',
				preview: props => (
					<LinkedInLinkPreview
						jobTitle={ __( 'Job Title (Company Name)', 'jetpack-publicize-pkg' ) }
						{ ...props }
					/>
				),
			},
			{
				title: __( 'Nextdoor', 'jetpack-publicize-pkg' ),
				icon: <SocialLogo icon="nextdoor" />,
				name: 'nextdoor',
				preview: NextdoorLinkPreview,
			},
			{
				title: __( 'Tumblr', 'jetpack-publicize-pkg' ),
				icon: <SocialLogo icon="tumblr" />,
				name: 'tumblr',
				preview: TumblrLinkPreview,
			},
			{
				title: __( 'Mastodon', 'jetpack-publicize-pkg' ),
				icon: <SocialLogo icon="mastodon" />,
				name: 'mastodon',
				preview: MastodonLinkPreview,
			},
			{
				title: __( 'Bluesky', 'jetpack-publicize-pkg' ),
				icon: <SocialLogo icon="bluesky" />,
				name: 'bluesky',
				preview: BlueskyLinkPreview,
			},
		],
		[]
	);
}
