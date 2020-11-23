/**
 * External dependencies
 */
import React from 'react';

/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export const BACKUP_TITLE = __( 'Jetpack Backup', 'jetpack' );
export const BACKUP_DESCRIPTION = __(
	'Always-on backups ensure you never lose your site.',
	'jetpack'
);
export const BACKUP_DESCRIPTION_REALTIME = __(
	'Always-on backups ensure you never lose your site. Your changes are saved as you edit and you have unlimited backup archives.',
	'jetpack'
);
export const DAILY_BACKUP_TITLE = createInterpolateElement(
	__( 'Jetpack Backup <em>Daily</em>', 'jetpack' ),
	{
		em: <em />,
	}
);

export const REALTIME_BACKUP_TITLE = createInterpolateElement(
	__( 'Jetpack Backup <em>Real-Time</em>', 'jetpack' ),
	{
		em: <em />,
	}
);

export const SEARCH_TITLE = __( 'Jetpack Search', 'jetpack' );
export const SEARCH_DESCRIPTION = __(
	'Incredibly powerful and customizable, Jetpack Search helps your visitors instantly find the right content – right when they need it.',
	'jetpack'
);
export const SEARCH_CUSTOMIZE_CTA = __( 'Customize your Search experience.', 'jetpack' );
export const SEARCH_SUPPORT = __( 'Search supports many customizations. ', 'jetpack' );
