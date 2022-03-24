/**
 * External dependencies
 */
import React from 'react';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import { imagePath } from 'constants/urls';

/**
 * The popup is a simple React component that displays a popup with a title, a lock icon, and a message
 *
 * @param {object} props - Props
 * @param {number} props.posts - The post count.
 * @param {number} props.comments - The comment count
 * @param {Function} props.onClose - Callback when the popup is closed
 * @returns {React.ReactElement} A React component.
 */
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
						'Be sure your %1$d posts, %2$d comments, and more information are safely backed up with Jetpack',
						'jetpack'
					),
					posts,
					comments
				) }
			</p>
		</div>
	);
};
