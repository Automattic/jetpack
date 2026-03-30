import { useExperimentWithAuth } from '@automattic/jetpack-explat';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { useState } from 'react';
import CelebrateLaunchModal from '../../../common/celebrate-launch/celebrate-launch-modal';
import { useLaunchSiteMutation } from '../../../common/hooks';
import { wpcomTrackEvent } from '../../../common/tracks';
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
	siteDomain,
	sitePlan,
	hasCustomDomain,
}: Props ) => {
	const [ , experimentData ] = useExperimentWithAuth( 'calypso_standardized_site_launch_gating' );
	const [ showCelebrateLaunchModal, setShowCelebrateLaunchModal ] = useState( false );

	const { mutate: launchSite } = useLaunchSiteMutation( () => setShowCelebrateLaunchModal( true ) );

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

	const gatedLaunchUrl = addQueryArgs( 'https://wordpress.com/start/launch-site', {
		siteSlug: siteDomain,
		ref: 'wp-admin',
	} );

	const showPreviewLink = isAnyComingSoonEnabled && hasSitePreviewLink;

	const handleLaunchClick = () => {
		wpcomTrackEvent( 'wpcom_settings_reading_launch_site_button_click' );

		if ( experimentData?.variationName === 'ungated_site_launch' ) {
			launchSite();
			return;
		}

		if ( experimentData?.variationName === 'gated_site_launch' ) {
			window.location.href = gatedLaunchUrl;
			return;
		}

		window.location.href = launchUrl;
	};

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
			{ showCelebrateLaunchModal && (
				<CelebrateLaunchModal
					siteDomain={ siteDomain }
					siteUrl={ homeUrl }
					sitePlan={ sitePlan }
					hasCustomDomain={ hasCustomDomain }
					onRequestClose={ () => setShowCelebrateLaunchModal( false ) }
				/>
			) }
		</>
	);
};

export default LaunchSite;
