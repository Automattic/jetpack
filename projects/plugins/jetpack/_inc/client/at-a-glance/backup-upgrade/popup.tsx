import { imagePath } from 'constants/urls';
import { __, sprintf } from '@wordpress/i18n';
import Button from 'components/button';
import React from 'react';
import { PopupProps } from './types';
/**
 * The popup is a simple React component that displays a popup with a title, a lock icon, and a message
 *
 * @param {PopupProps} props - Props
 * @returns {React.ReactElement} - JSX Element
 */
export const Popup: React.FC< PopupProps > = ( { posts, comments, onClosePopup } ) => {
	return (
		<div className="jp-dash-upgrade-backup__popup">
			<Button
				onClick={ onClosePopup }
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
