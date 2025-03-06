import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import SitePreviewLink from '../site-preview-link';
import type { SitePreviewLinkObject } from '../site-preview-link';

interface Props {
	homeUrl: string;
	siteTitle: string;
	isUnlaunchedSite: boolean;
	hasSitePreviewLink: boolean;
	sitePreviewLink?: SitePreviewLinkObject;
	sitePreviewLinkNonce: string;
	blogPublic: number;
	wpcomComingSoon: number;
	wpcomPublicComingSoon: number;
}

const LaunchSite = ( {
	homeUrl,
	siteTitle,
	isUnlaunchedSite,
	hasSitePreviewLink,
	sitePreviewLink,
	sitePreviewLinkNonce,
	blogPublic,
	wpcomComingSoon,
	wpcomPublicComingSoon,
}: Props ) => {
	// isPrivateAndUnlaunched means it is an unlaunched coming soon v1 site
	const isPrivateAndUnlaunched = -1 === blogPublic && isUnlaunchedSite;
	const isAnyComingSoonEnabled =
		( 0 === blogPublic && wpcomPublicComingSoon ) || isPrivateAndUnlaunched || wpcomComingSoon;

	const launchUrl = addQueryArgs( 'https://wordpress.com/start/launch-site', {
		siteSlug: new URL( homeUrl ).host,
		source: 'options-reading.php',
		new: siteTitle,
		search: 'yes',
	} );

	const showPreviewLink = isAnyComingSoonEnabled && hasSitePreviewLink;

	return (
		<>
			<p>
				{ isAnyComingSoonEnabled
					? __(
							'Your site hasn\'t been launched yet. It is hidden from visitors behind a "Coming Soon" notice until it is launched.',
							'jetpack-mu-wpcom'
					  )
					: __(
							"Your site hasn't been launched yet. It's private; only you can see it until it is launched.",
							'jetpack-mu-wpcom',
							0
					  ) }
			</p>
			<a
				role="button"
				className="button-secondary"
				style={ { marginTop: '0.5em' } }
				href={ launchUrl }
			>
				{ __( 'Launch site', 'jetpack-mu-wpcom' ) }
			</a>
			{ showPreviewLink && (
				<SitePreviewLink
					homeUrl={ homeUrl }
					sitePreviewLink={ sitePreviewLink }
					sitePreviewLinkNonce={ sitePreviewLinkNonce }
					description={
						<>
							{ __(
								'"Coming soon" sites are only visible to you and invited users.',
								'jetpack-mu-wpcom'
							) }
							&nbsp;
						</>
					}
				/>
			) }
		</>
	);
};

export default LaunchSite;
