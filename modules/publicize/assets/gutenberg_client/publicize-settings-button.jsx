/**
 * Publicize settings button component.
 *
 * Component which allows user to click to open settings
 * in a new window/tab. If window/tab is closed, then
 * connections will be automatically refreshed.
 *
 * @since  5.9.1
 */

/**
 * External dependencies
 */
import React, { Component } from 'react';

/**
 * Internal dependencies
 */
const { __ } = window.wp.i18n;

class PublicizeSettingsButton extends Component {
	/**
	 * Opens up popup so user can view/modify connections
	 *
	 * @since 5.9.1
	 *
	 * @param {object} event Event instance for onClick.
	 */
	settingsClick = ( event ) => {
		const href = "options-general.php?page=sharing";
		const { refreshCallback } = this.props;
		event.preventDefault();
		/**
		 * Open a popup window, and
		 * when it is closed, refresh connections
		 */
		const popupWin = window.open( href, '', '' );
		let popupTimer = window.setInterval( () => {
			if ( false !== popupWin.closed ) {
				window.clearInterval( popupTimer );
				refreshCallback();
			}
		}, 500 );
	}

	render() {
		const { isLoading } = this.props;

		return (
			<a
				onClick={ this.settingsClick }
				href="javascript:void(0)"
			>
				{ __( 'Settings' ) }
			</a>
		);
	}
}

export default PublicizeSettingsButton;

