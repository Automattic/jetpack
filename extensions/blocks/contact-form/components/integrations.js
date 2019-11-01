/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import analytics from '../../../../_inc/client/lib/analytics';
import { Button, PanelBody, ToggleControl } from '@wordpress/components';

// copy / paste from calypso
const getScreenCenterSpecs = ( width, height ) => {
	const screenTop = typeof window.screenTop !== 'undefined' ? window.screenTop : window.screenY,
		screenLeft = typeof window.screenLeft !== 'undefined' ? window.screenLeft : window.screenX;

	return [
		'width=' + width,
		'height=' + height,
		'top=' + ( screenTop + window.innerHeight / 2 - height / 2 ),
		'left=' + ( screenLeft + window.innerWidth / 2 - width / 2 ),
	].join();
};

class Integrations extends Component {
	constructor( ...args ) {
		super( ...args );

		this.state = {
			enabled: false,
			connectionResponse: null,
		};
	}

	onClick = () => {
		const createDriveConnection = async keyring_id => {
			try {
				const { subject } = this.props;
				const sheetsResponse = await apiFetch( {
					path: '/wpcom/v2/external-connections/google-sheets',
					method: 'POST',
					data: { keyring_id, subject },
				} );

				this.props.saveDriveFileNameInBlockAttributes( sheetsResponse );
			} catch {}
		};

		void analytics.tracks.recordEvent( 'jetpack_editor_connection_click', {
			serviceSlug: 'google_drive',
		} );

		window.open(
			this.state.connectionResponse.connect_url,
			'_blank',
			'toolbar=0,location=0,menubar=0,' + getScreenCenterSpecs( 700, 700 )
		);

		// opener:
		window.onmessage = function( { data } ) {
			if ( data.keyring_id ) {
				createDriveConnection( data.keyring_id );
			}
		};
	};

	toggleGoogleDriveIntegration = () => {
		this.setState(
			{
				enabled: ! this.state.enabled,
			},
			this.checkGoogleDriveIntegrationStatus
		);
	};

	checkGoogleDriveIntegrationStatus = async () => {
		if ( ! this.state.enabled ) {
			return;
		}

		try {
			const sheetsResponse = await apiFetch( {
				path: '/wpcom/v2/external-connections/google-sheets',
			} );

			this.setState( {
				connectionResponse: sheetsResponse,
			} );
		} catch {}
	};

	render() {
		return (
			<PanelBody title={ __( 'Integrations', 'jetpack' ) }>
				<ToggleControl
					label={ __( 'Google Drive' ) }
					checked={ this.props.driveFileName || this.state.enabled }
					onChange={ this.toggleGoogleDriveIntegration }
				/>
				{ this.state.enabled && this.state.connectionResponse && (
					<Button onClick={ this.onClick }>{ __( 'Connect', 'jetpack' ) }</Button>
				) }
				{ this.props.driveFileName && (
					<div>
						{ __( 'File name', 'jetpack' ) }: { this.props.driveFileName }
					</div>
				) }
			</PanelBody>
		);
	}
}

export default Integrations;
