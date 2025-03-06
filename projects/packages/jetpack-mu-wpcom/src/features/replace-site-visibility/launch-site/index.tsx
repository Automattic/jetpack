import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

interface Props {
	homeUrl: string;
	isUnlaunchedSite: boolean;
	blogPublic: number;
	wpcomComingSoon: number;
	wpcomPublicComingSoon: number;
}

const LaunchSite = ( { homeUrl, blogPublic, wpcomComingSoon, wpcomPublicComingSoon }: Props ) => {
	// isPrivateAndUnlaunched means it is an unlaunched coming soon v1 site
	const isPrivateAndUnlaunched = -1 === blogPublic && isUnlaunchedSite;
	const isAnyComingSoonEnabled =
		( 0 === blogPublic && wpcomPublicComingSoon ) || isPrivateAndUnlaunched || wpcomComingSoon;

	const launchUrl = addQueryArgs( 'https://wordpress.com/start/launch-site', {
		siteSlug: new URL( homeUrl ).host,
		source: 'options-reading.php',
		search: 'yes',
	} );

	return (
		<>
			<p>
				{ __(
					'Your site hasn\'t been launched yet. It is hidden from visitors behind a "Coming Soon" notice until it is launched.',
					'jetpack-mu-wpcom'
				) }
				{ isAnyComingSoonEnabled
					? __(
							'Your site hasn\'t been launched yet. It is hidden from visitors behind a "Coming Soon" notice until it is launched.',
							'jetpack-mu-wpcom'
					  )
					: __(
							"Your site hasn't been launched yet. It's private; only you can see it until it is launched.",
							'jetpack-mu-wpcom'
					  ) }
			</p>
			<a role="button" className="button-secondary" href={ launchUrl }>
				{ __( 'Launch site', 'jetpack-mu-wpcom' ) }
			</a>
		</>
	);
};

export default LaunchSite;
