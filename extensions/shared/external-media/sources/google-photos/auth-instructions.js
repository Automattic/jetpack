/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment, memo } from '@wordpress/element';

import { GooglePhotosLogo } from '../../../icons';

function AuthInstructions() {
	return (
		<Fragment>
			<GooglePhotosLogo />
			<p>
				{ __(
					'To show your Google Photos library you need to connect your Google account.',
					'jetpack'
				) }
			</p>
			<p>{ __( 'You can remove the connection in either of these places:', 'jetpack' ) }</p>
			<ul>
				<li>
					<a target="_blank" rel="noopener noreferrer" href="https://myaccount.google.com/security">
						{ __( 'Google Security page', 'jetpack' ) }
					</a>
				</li>
				<li>
					<a
						target="_blank"
						rel="noopener noreferrer"
						href="https://wordpress.com/marketing/connections/"
					>
						{ __( 'WordPress.com Connections', 'jetpack' ) }
					</a>
				</li>
			</ul>
		</Fragment>
	);
}

export default memo( AuthInstructions );
