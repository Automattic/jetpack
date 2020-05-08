/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { SOURCE_GOOGLE_PHOTOS } from '../../constants';
// TODO: import requestExternalAccess from '@automattic/request-external-access';
// Remove following line, once package is ready.
const requestExternalAccess = () => {};
import { getApiUrl } from '../api';
import { GooglePhotosLogo } from '../../../icons';

class GooglePhotosAuth extends Component {
	constructor( props ) {
		super( props );

		// Set default mediaType filter if we are only allowed images
		this.state = {
			isAuthing: false,
		};
	}

	onAuthorize = () => {
		this.setState( { isAuthing: true } );

		// Get connection details
		apiFetch( {
			path: getApiUrl( 'connection', SOURCE_GOOGLE_PHOTOS ),
		} )
			.then( service => {
				if ( service.error ) {
					throw service.message;
				}

				// Open authorize URL in a window and let it play out
				requestExternalAccess( service.connect_URL, () => {
					this.setState( { isAuthing: false } );
					this.getNextPage( true );
				} );
			} )
			.catch( () => {
				// Not much we can tell the user at this point so let them try and auth again
				this.setState( { isAuthing: false } );
			} );
	};

	getAuthInstructions( isAuthing ) {
		if ( isAuthing ) {
			return __( 'Awaiting authorization', 'jetpack' );
		}

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
						<a
							target="_blank"
							rel="noopener noreferrer"
							href="https://myaccount.google.com/security"
						>
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

	render() {
		const { requiresAuth } = this.props;
		const { isAuthing } = this.state;

		if ( requiresAuth ) {
			return (
				<div className="jetpack-external-media-auth">
					<p>{ this.getAuthInstructions( isAuthing ) }</p>
					<Button isPrimary disabled={ isAuthing } onClick={ this.onAuthorize }>
						{ __( 'Authorize', 'jetpack' ) }
					</Button>
				</div>
			);
		}
	}
}

export default GooglePhotosAuth;
