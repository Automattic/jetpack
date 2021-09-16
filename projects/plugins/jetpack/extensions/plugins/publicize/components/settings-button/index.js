/**
 * Publicize settings button component.
 *
 * Component which allows user to click to open settings
 * in a new window/tab.
 * If window/tab is closed,
 * then connections will be automatically refreshed.
 */
import { debounce } from 'lodash';

/**
 * External dependencies
 */
import PageVisibility from 'react-page-visibility';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';

/**
 * Internal dependencies
 */
import getSiteFragment from '../../../../shared/get-site-fragment';
import useSocialMediaActions from '../../hooks/use-social-media-actions';
import { useSelectSocialMediaConnections } from '../../hooks/use-select-social-media';

const refreshThreshold = 2000;

export default function PublicizeSettingsButton() {
	const { refreshConnections } = useSocialMediaActions();
	const { connections } = useSelectSocialMediaConnections();

	if ( ! connections?.length ) {
		return null;
	}

	const siteFragment = getSiteFragment();

	const refresh = debounce( function ( isVisible ) {
		if ( ! isVisible ) {
			return;
		}
		refreshConnections();
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
		<PageVisibility onChange={ refresh }>
			<div className="jetpack-publicize-add-connection-wrapper">
				<ExternalLink href={ href } target="_blank">
					{ __( 'Connect an account', 'jetpack' ) }
				</ExternalLink>
			</div>
		</PageVisibility>
	);
}
