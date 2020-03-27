/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';

export const BACKUP_TITLE = __( 'Jetpack Backup' );
export const BACKUP_DESCRIPTION = __( 'Always-on backups ensure you never lose your site.' );
export const BACKUP_DESCRIPTION_REALTIME = __(
	'Always-on backups ensure you never lose your site. Your changes are saved as you edit and you have unlimited backup archives.'
);
export const DAILY_BACKUP_TITLE = __( 'Jetpack Backup {{em}}Daily{{/em}}', {
	components: { em: <em /> },
} );

export const REALTIME_BACKUP_TITLE = __( 'Jetpack Backup {{em}}Real-Time{{/em}}', {
	components: { em: <em /> },
} );

export const SEARCH_TITLE = __( 'Jetpack Search' );
export const SEARCH_DESCRIPTION = __(
	'Enhanced Search for more relevant results using modern ranking algorithms, ' +
		'boosting of specific results, advanced filtering and faceting, and more. '
);
