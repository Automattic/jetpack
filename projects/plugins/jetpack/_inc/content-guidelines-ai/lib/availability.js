import { __ } from '@wordpress/i18n';
import { config } from '../constants';

/**
 * Show an unavailable notice if Jetpack AI is not available.
 *
 * @param {Function} createWarningNotice - Notice dispatcher.
 * @return {boolean} True if AI is unavailable (notice was shown).
 */
export function showUnavailableNotice( createWarningNotice ) {
	if ( config.available ) {
		return false;
	}

	const message = ! config.isConnected
		? __(
				'Jetpack AI is not available. Connect your site to WordPress.com to get started.',
				'jetpack'
		  )
		: __( 'Upgrade now to start using Jetpack AI.', 'jetpack' );
	const actionLabel = ! config.isConnected
		? __( 'Connect', 'jetpack' )
		: __( 'Upgrade', 'jetpack' );

	createWarningNotice( message, {
		type: 'snackbar',
		actions: config.upgradeUrl ? [ { label: actionLabel, url: config.upgradeUrl } ] : [],
	} );

	return true;
}
