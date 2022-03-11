/**
 * External dependencies
 */
import { imagePath } from 'constants/urls';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import React from 'react';

export const Popup = ( { posts, comments, onClose } ) => {
	return (
		<div className="jp-dash-upgrade-backup__popup">
			<Button
				onClick={ onClose }
				className="jp-dash-upgrade-backup__popup-close-icon"
				compact
				borderless
			>
				<img src={ imagePath + '/close.svg' } alt={ __( 'Close', 'jetpack' ) } />
			</Button>
			<img
				className="jp-dash-upgrade-backup__popup-lock-icon"
				src={ imagePath + '/lock.svg' }
				alt={ __( 'Locked', 'jetpack' ) }
			/>
			<p className="jp-dash-upgrade-backup__popup-title">
				{ __( 'Upgrade to backup', 'jetpack' ) }
			</p>
			<p>
				{ sprintf(
					/* translators: 1 number of posts, 2 number of comments */
					__(
						'Be sure your %1$d posts, %2$d comments and more information is safely backed up with Jetpack',
						'jetpack'
					),
					posts,
					comments
				) }
				{ '' }
			</p>
		</div>
	);
};
