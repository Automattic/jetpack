/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import TextInput from 'components/text-input';
import ExternalLink from 'components/external-link';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import {
	isFetchingSiteData,
} from 'state/site';
import {
	FormLabel
} from 'components/forms';
import Gridicon from 'components/gridicon';
import Button from 'components/button';
import requestExternalAccess from 'lib/sharing';
import { getExternalServiceConnectUrl } from 'state/publicize/reducer';
import {
	checkVerifyStatusGoogle,
	verifySiteGoogle,
	isFetchingGoogleSiteVerify,
	isConnectedToGoogleSiteVerificationAPI,
	isSiteVerifiedWithGoogle,
	isVerifyingGoogleSite,
	getGoogleSiteVerificationError,
} from 'state/site-verify';
import { userCanManageOptions } from 'state/initial-state';
import { createNotice, removeNotice } from 'components/global-notices/state/notices/actions';
import { getSiteRawUrl } from 'state/initial-state';

class GoogleVerificationServiceComponent extends React.Component {
	state = {
		inputVisible: false
	};

	componentDidMount() {
		this.props.checkVerifyStatusGoogle().then( ( { token } ) => {
			if ( ! this.props.getOptionValue( 'google' ) && token ) {
				return this.props.updateOptions( { google: token } );
			}
		} );
	}

	checkAndVerifySite() {
		this.props.createNotice( 'is-info', __( 'Verifying...' ), { id: 'verifying-site-google' } );
		this.props.checkVerifyStatusGoogle().then( ( { token } ) => {
			if ( token !== this.props.value ) {
				return this.props.updateOptions( { google: token } );
			}
		} ).then( () => {
			this.props.removeNotice( 'verifying-site-google' );
			if ( ! this.props.isSiteVerifiedWithGoogle ) {
				this.props.verifySiteGoogle().then( () => {
					if ( this.props.googleSiteVerificationError ) {
						this.props.createNotice(
							'is-error',
							__( 'Site failed to verify: %(error)s', {
								args: {
									error: this.props.googleSiteVerificationError.message
								}
							} ),
							{
								id: 'verify-site-google-error',
								duration: 5000
							}
						);
					}
				} );
			}
		} );
	}

	handleClickGoogleVerify = () => {
		if ( this.props.fetchingSiteData || this.props.fetchingGoogleSiteVerify ) {
			return;
		}

		if ( ! this.props.isConnectedToGoogle ) {
			requestExternalAccess( this.props.googleSiteVerificationConnectUrl, () => {
				this.checkAndVerifySite();
			} );
			return;
		}

		this.checkAndVerifySite();
	};

	toggleVerifyMethod = () => {
		this.setState( {
			inputVisible: ! this.state.inputVisible,
		} );
	};

	render() {
		if ( this.state.inputVisible ) {
			return (
				<FormLabel
					className="jp-form-input-with-prefix"
					key="verification_service_google">
					<span>{ __( 'Google' ) }</span>
					<TextInput
						name="google"
						value={ this.props.value }
						placeholder={ this.props.placeholder }
						className="code"
						disabled={ this.props.isUpdating( 'google' ) }
						onChange={ this.props.onOptionChange } />
					<Button
						primary
						type="button"
						className="jp-form-site-verification-edit-button"
						onClick={ this.props.onSubmit }>
						{ __( 'Save' ) }
					</Button>
				</FormLabel>
			);
		}

		if ( this.props.isSiteVerifiedWithGoogle ) {
			return (
				<div>
					<div
						className="jp-form-input-with-prefix"
						key="verification_service_google">
						<span>{ __( 'Google' ) }</span>
						<div className="jp-form-site-verification-verified">
							<Gridicon icon="checkmark-circle" size={ 20 } />
							{ ' ' }
							<span>{ __( 'Your site is verified with Google' ) }</span>
						</div>
						<Button
							type="button"
							className="jp-form-site-verification-edit-button"
							onClick={ this.toggleVerifyMethod }>
							{ __( 'Edit' ) }
						</Button>
					</div>
					<div className="jp-form-input-with-prefix-bottom-message" >
						{
							__( "Monitor your site's traffic and performance from the {{a}}Google Search Console{{/a}}", {
								components: {
									a: <ExternalLink
										icon={ true }
										iconSize={ 12 }
										target="_blank" rel="noopener noreferrer"
										href={ 'https://search.google.com/search-console?resource_id=https://' + this.props.rawUrl }
									/>
								}
							} )
						}
					</div>
				</div>
			);
		}

		const disabled = this.props.fetchingSiteData || this.props.fetchingGoogleSiteVerify || this.props.isVerifyingGoogleSite;

		return (
			<div
				className="jp-form-input-with-prefix jp-form-google-label-unverified"
				key="verification_service_google">
				<span>{ __( 'Google' ) }</span>
				<Button
					primary
					type="button"
					disabled={ disabled }
					onClick={ this.handleClickGoogleVerify }>
						{ __( 'Auto verify with Google' ) }
				</Button>
				<span className="jp-form-google-separator">
					{ __( 'or' ) }
				</span>
				<Button
					type="button"
					disabled={ disabled }
					onClick={ this.toggleVerifyMethod }>
					{ __( 'Manually verify with Google' ) }
				</Button>
			</div>
		);
	}
}

export default connect(
	state => {
		return {
			fetchingSiteData: isFetchingSiteData( state ),
			googleSiteVerificationConnectUrl: getExternalServiceConnectUrl( state, 'google_site_verification' ),
			fetchingGoogleSiteVerify: isFetchingGoogleSiteVerify( state ),
			isConnectedToGoogle: isConnectedToGoogleSiteVerificationAPI( state ),
			isSiteVerifiedWithGoogle: isSiteVerifiedWithGoogle( state ),
			isVerifyingGoogleSite: isVerifyingGoogleSite( state ),
			userCanManageOptions: userCanManageOptions( state ),
			googleSiteVerificationError: getGoogleSiteVerificationError( state ),
			rawUrl: getSiteRawUrl( state ),
		};
	},
	{
		checkVerifyStatusGoogle,
		createNotice,
		removeNotice,
		verifySiteGoogle,
	}
)( GoogleVerificationServiceComponent );
