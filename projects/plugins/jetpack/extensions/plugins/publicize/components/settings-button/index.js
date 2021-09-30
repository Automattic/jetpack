/**
 * Publicize settings button component.
 *
 * Component which allows user to click to open settings
 * in a new window/tab.
 * If window/tab is closed,
 * then connections will be automatically refreshed.
 */
import { debounce } from 'lodash';
import PageVisibility from 'react-page-visibility';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import getSiteFragment from '../../../../shared/get-site-fragment';
import useSelectSocialMediaConnections from '../../hooks/use-social-media-connections';

const refreshThreshold = 2000;

export default function PublicizeSettingsButton() {
	const { refresh, hasConnections } = useSelectSocialMediaConnections();
	const siteFragment = getSiteFragment();

	const debouncedRefresh = debounce( function ( isVisible ) {
		if ( ! isVisible ) {
			return;
		}
		refresh();
	}, refreshThreshold );

	/*
	 * If running in WP.com wp-admin or in Calypso,
	 * we redirect to Calypso sharing settings.
	 *
	 * If running in WordPress.org wp-admin,
	 * we redirect to Sharing settings in wp-admin.
	 */
	const href = siteFragment
		? `https://wordpress.com/marketing/connections/${ siteFragment }`
		: 'options-general.php?page=sharing&publicize_popup=true';

	return (
		<PageVisibility onChange={ debouncedRefresh }>
			<Button href={ href } target="_blank" isSecondary isLink>
				{ hasConnections
					? __( 'Admin social media accounts', 'jetpack' )
					: __( 'Connect social media accounts', 'jetpack' ) }
			</Button>
		</PageVisibility>
	);
}
