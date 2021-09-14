/**
 * Publicize settings button component.
 *
 * Component which allows user to click to open settings
 * in a new window/tab. If window/tab is closed, then
 * connections will be automatically refreshed.
 */

/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
import { ExternalLink } from '@wordpress/components';

/**
 * Internal dependencies
 */
import getSiteFragment from '../../../../shared/get-site-fragment';

export default function PublicizeSettingsButton( { refreshCallback, className } ) {
	const siteFragment = getSiteFragment();

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

	/**
	 * Opens up popup so user can view/modify connections
	 *
	 * @param {object} event - Event instance for onClick.
	 */
	function settingsClick( event ) {
		event.preventDefault();
		if ( ! event.target?.href ) {
			return;
		}

		/**
		 * Open a popup window, and
		 * when it is closed, refresh connections
		 */
		const popupWin = window.open( event.target.href, '', '' );
		const popupTimer = window.setInterval( () => {
			if ( false !== popupWin.closed ) {
				window.clearInterval( popupTimer );
				refreshCallback();
			}
		}, 500 );
	}

	return (
		<div className={ classnames( 'jetpack-publicize-add-connection-container', className ) }>
			<ExternalLink href={ href } onClick={ settingsClick }>
				{ __( 'Connect an account', 'jetpack' ) }
			</ExternalLink>
		</div>
	);
}
