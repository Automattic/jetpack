/**
 * External dependencies
 */
import { AdminPage, Col, Container, GlobalNotices } from '@automattic/jetpack-components';
import { useConnection, getUserConnectionUrl } from '@automattic/jetpack-connection';
import { getSiteData, isSimpleSite } from '@automattic/jetpack-script-data';
import { createRoot, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { NewsletterSettingsBody } from './newsletter-settings';
import './style.scss';

/**
 * Newsletter Settings App — legacy `wp-admin/admin.php?page=jetpack-newsletter`
 * surface. The shared body lives in `./newsletter-settings`; this file owns
 * the standalone chrome (Jetpack-styled `AdminPage`, container grid, global
 * snackbar surface) and the WP.com connection check.
 *
 * The modernized dashboard mounts `NewsletterSettingsBody` directly inside
 * its tabbed shell, so the chrome and connection imports here only get
 * evaluated on the legacy webpack bundle.
 *
 * @return The newsletter settings page, wrapped in legacy chrome.
 */
export function NewsletterSettingsApp(): JSX.Element {
	// On Simple sites, users are always connected — skip the check.
	const { hasConnectedOwner: rawHasConnectedOwner } = useConnection();
	const hasConnectedOwner = isSimpleSite() || rawHasConnectedOwner;
	const connectUrl = useMemo(
		() =>
			getUserConnectionUrl( {
				from: 'jetpack-newsletter',
			} ),
		[]
	);

	// `AdminPage` writes these into the shared `restApi` client on mount,
	// defaulting to '' when omitted — which clobbers the root the settings
	// API set up itself and breaks saves with a 404. Feed it the real values
	// from script data so it stays consistent with `./api.ts`.
	const siteData = getSiteData();

	return (
		<AdminPage
			title={ 'Newsletter' /** "Newsletter" is a product name, do not translate. */ }
			subTitle={ __(
				'Transform your blog posts into newsletters to easily reach your subscribers.',
				'jetpack-newsletter'
			) }
			apiRoot={ siteData?.rest_root }
			apiNonce={ siteData?.rest_nonce }
		>
			<GlobalNotices />
			<Container horizontalSpacing={ 0 }>
				<Col>
					<div id="jp-admin-notices" className="newsletter-jitm-card" />
				</Col>
			</Container>
			<Container horizontalSpacing={ 3 }>
				<Col>
					<NewsletterSettingsBody
						hasConnectedOwner={ hasConnectedOwner }
						connectUrl={ connectUrl }
					/>
				</Col>
			</Container>
		</AdminPage>
	);
}

const container = document.getElementById( 'newsletter-settings-root' );
if ( container ) {
	const root = createRoot( container );
	root.render( <NewsletterSettingsApp /> );
}
