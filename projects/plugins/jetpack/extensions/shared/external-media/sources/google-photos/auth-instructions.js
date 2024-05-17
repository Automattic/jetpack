import { Fragment, memo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { GooglePhotosLogo } from '../../../icons';

function AuthInstructions() {
	return (
		<Fragment>
			<GooglePhotosLogo />
			<p>{ __( 'To get started, connect your site to your Google Photos library.', 'jetpack' ) }</p>
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
