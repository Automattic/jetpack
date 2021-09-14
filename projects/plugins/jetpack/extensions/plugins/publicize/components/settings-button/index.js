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

export default function PublicizeSettingsButton( props ) {
	function getButtonLink() {
		const siteFragment = getSiteFragment();

		// If running in WP.com wp-admin or in Calypso, we redirect to Calypso sharing settings.
		if ( siteFragment ) {
			return `https://wordpress.com/marketing/connections/${ siteFragment }`;
		}

		// If running in WordPress.org wp-admin we redirect to Sharing settings in wp-admin.
		return 'options-general.php?page=sharing&publicize_popup=true';
	}

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

		const href = event.target.href;
		const { refreshCallback } = props;
		/**
		 * Open a popup window, and
		 * when it is closed, refresh connections
		 */
		const popupWin = window.open( href, '', '' );
		const popupTimer = window.setInterval( () => {
			if ( false !== popupWin.closed ) {
				window.clearInterval( popupTimer );
				refreshCallback();
			}
		}, 500 );
	}

	const className = classnames( 'jetpack-publicize-add-connection-container', props.className );

	return (
		<div className={ className }>
			<ExternalLink href={ getButtonLink() } onClick={ settingsClick }>
				{ __( 'Connect an account', 'jetpack' ) }
			</ExternalLink>
		</div>
	);
}
