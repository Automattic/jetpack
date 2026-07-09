import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { useSiteLaunchGatingVariant } from '../../../common/hooks';
import { wpcomTrackEvent } from '../../../common/tracks';
import SitePreviewLink from '../site-preview-link';
import type { SitePreviewLinkObject } from '../site-preview-link';

interface Props {
	blogId: number;
	homeUrl: string;
	siteTitle: string;
	isUnlaunchedSite: boolean;
	hasSitePreviewLink: boolean;
	sitePreviewLink?: SitePreviewLinkObject;
	sitePreviewLinkNonce: string;
	blogPublic: number;
	wpcomComingSoon: number;
	wpcomPublicComingSoon: number;
	siteDomain: string;
	sitePlan?: { product_slug: string };
	hasCustomDomain: boolean;
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
	const [ , variant ] = useSiteLaunchGatingVariant();

	// isPrivateAndUnlaunched means it is an unlaunched coming soon v1 site
	const isPrivateAndUnlaunched = -1 === blogPublic && isUnlaunchedSite;
	const isAnyComingSoonEnabled =
		( 0 === blogPublic && wpcomPublicComingSoon ) || isPrivateAndUnlaunched || wpcomComingSoon;

	const launchUrl = addQueryArgs( 'https://wordpress.com/start/launch-site', {
		siteSlug: new URL( homeUrl ).host,
		source: 'options-reading.php',
		new: siteTitle,
		search: 'yes',
		ref: 'wp-admin/options-reading.php',
	} );

	const showPreviewLink = isAnyComingSoonEnabled && hasSitePreviewLink;

	const descriptions = {
		comingSoon: __(
			'Your site hasn\'t been launched yet. It is hidden from visitors behind a "Coming Soon" notice until it is launched.',
			'jetpack-mu-wpcom'
		),
		private: __(
			"Your site hasn't been launched yet. It's private; only you can see it until it is launched.",
			'jetpack-mu-wpcom'
		),
	};

	const handleLaunchClick = () => {
		wpcomTrackEvent( 'wpcom_settings_reading_launch_site_button_click' );

		// Site launch gating: 'semi_gated_site_launch' is the shipped default. The other
		// branches are scaffolding for future experiments; see useSiteLaunchGatingVariant.
		switch ( variant ) {
			case 'semi_gated_site_launch':
			case null:
			default:
				window.location.href = launchUrl;
		}
	};

	return (
		<>
			<p>{ isAnyComingSoonEnabled ? descriptions.comingSoon : descriptions.private }</p>
			<button
				className="button is-secondary"
				type="button"
				style={ { marginTop: '0.5em' } }
				onClick={ handleLaunchClick }
			>
				{ __( 'Launch site', 'jetpack-mu-wpcom' ) }
			</button>
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
