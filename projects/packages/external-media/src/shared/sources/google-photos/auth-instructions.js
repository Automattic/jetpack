import { GooglePhotosLogo } from '@automattic/jetpack-shared-extension-utils/icons';
import { Fragment, memo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React from 'react';

/**
 * AuthInstructions component
 *
 * @return {React.ReactElement} - JSX Element
 */
function AuthInstructions() {
	return (
		<Fragment>
			<GooglePhotosLogo />
			<p>
				{ __(
					'To get started, connect your site to your Google Photos library.',
					'jetpack-external-media'
				) }
			</p>
			<p>
				{ __(
					'You can remove the connection in either of these places:',
					'jetpack-external-media'
				) }
			</p>
			<ul>
				<li>
					<a target="_blank" rel="noopener noreferrer" href="https://myaccount.google.com/security">
						{ __( 'Google Security page', 'jetpack-external-media' ) }
					</a>
				</li>
				<li>
					<a
						target="_blank"
						rel="noopener noreferrer"
						href="https://wordpress.com/marketing/connections/"
					>
						{ __( 'WordPress.com Connections', 'jetpack-external-media' ) }
					</a>
				</li>
			</ul>
		</Fragment>
	);
}

export default memo( AuthInstructions );
