/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { translate as __ } from 'i18n-calypso';
import TextInput from 'components/text-input';
import ExternalLink from 'components/external-link';
import { connect } from 'react-redux';
import analytics from 'lib/analytics';

/**
 * Internal dependencies
 */
import { isFetchingSiteData } from 'state/site';
import { FormLabel } from 'components/forms';
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
	isGoogleSiteVerificationOwner,
	getGoogleSiteVerificationError,
	getGoogleSearchConsoleUrl,
} from 'state/site-verify';
import { userCanManageOptions } from 'state/initial-state';
import { createNotice, removeNotice } from 'components/global-notices/state/notices/actions';

class GoogleVerificationServiceComponent extends React.Component {
	static propTypes = {
		disabled: PropTypes.bool,
	};

	static defaultProps = {
		disabled: false,
	};

	state = {
		inputVisible: false,
	};

	componentDidMount() {
		if ( ! this.props.isCurrentUserLinked ) {
			return;
		}

		this.props.checkVerifyStatusGoogle().then( response => {
			// if the site is not in google search console anymore, reset the verification token
			// and call checkVerifyStatusGoogle to unverify it
			if (
				this.props.googleSiteVerificationError &&
				this.props.googleSiteVerificationError.code === 'unverify-site-error'
			) {
				this.props
					.updateOptions( { google: '' } )
					.then( () => this.props.checkVerifyStatusGoogle() );
			}
			if ( ! response ) {
				return;
			}
			if ( ! this.props.getOptionValue( 'google' ) && response.token ) {
				return this.props.updateOptions( { google: response.token } );
			}

			// show manual box if we have a non-verified site but we do have a local token
			if ( this.props.getOptionValue( 'google' ) && ! response.token && ! response.verified ) {
				this.setState( { inputVisible: true } );
			}
		} );
	}

	checkAndVerifySite( keyringId ) {
		this.props.createNotice( 'is-info', __( 'Verifying...' ), { id: 'verifying-site-google' } );
		this.props
			.checkVerifyStatusGoogle( keyringId )
			.then( response => {
				if ( ! response ) {
					return;
				}
				if ( response.token !== this.props.value ) {
					return this.props.updateOptions( { google: response.token } );
				}
			} )
			.then( () => {
				this.props.removeNotice( 'verifying-site-google' );
				if ( ! this.props.isSiteVerifiedWithGoogle ) {
					this.props.verifySiteGoogle( keyringId ).then( () => {
						if ( this.props.googleSiteVerificationError ) {
							const errorMessage = this.props.googleSiteVerificationError.message;
							analytics.tracks.recordEvent( 'jetpack_site_verification_google_verify_error', {
								error_message: errorMessage,
							} );
							this.props.createNotice(
								'is-error',
								__( 'Site failed to verify: %(error)s', {
									args: {
										error: errorMessage,
									},
								} ),
								{
									id: 'verify-site-google-error',
									duration: 5000,
								}
							);
						} else if ( this.props.isSiteVerifiedWithGoogle ) {
							analytics.tracks.recordEvent( 'jetpack_site_verification_google_verify_success' );
						}
					} );
				}
			} );
	}

	handleClickAutoVerify = () => {
		if ( this.props.fetchingSiteData || this.props.fetchingGoogleSiteVerify ) {
			return;
		}

		analytics.tracks.recordEvent( 'jetpack_site_verification_google_auto_verify_click' );

		requestExternalAccess( this.props.googleSiteVerificationConnectUrl, keyringId => {
			if ( keyringId ) {
				this.checkAndVerifySite( keyringId );
			}
		} );
	};

	handleClickSetManually = event => {
		analytics.tracks.recordEvent( 'jetpack_site_verification_google_manual_verify_click', {
			is_owner: this.props.isOwner,
		} );

		this.toggleVerifyMethod( event );
	};

	handleClickEdit = event => {
		analytics.tracks.recordEvent( 'jetpack_site_verification_google_edit_click', {
			is_owner: this.props.isOwner,
		} );

		this.toggleVerifyMethod( event );
	};

	handleClickCancel = event => {
		analytics.tracks.recordEvent( 'jetpack_site_verification_google_cancel_click', {
			is_owner: this.props.isOwner,
		} );

		this.props.resetFormStateOption( 'google' );
		this.toggleVerifyMethod( event );
	};

	quickSave = event => {
		analytics.tracks.recordEvent( 'jetpack_site_verification_google_manual_verify_save', {
			is_owner: this.props.isOwner,
			is_empty: ! this.props.value,
		} );

		this.props.onSubmit( event );
	};

	toggleVerifyMethod = () => {
		this.setState( {
			inputVisible: ! this.state.inputVisible,
		} );
	};

	handleOnTextInputKeyPress = event => {
		if ( event.key === 'Enter' ) {
			this.quickSave();
		}
	};

	render() {
		const isForbidden =
			this.props.googleSiteVerificationError &&
			this.props.googleSiteVerificationError.code === 'forbidden';
		if ( this.state.inputVisible || isForbidden || ! this.props.isCurrentUserLinked ) {
			return (
				<div>
					<FormLabel className="jp-form-input-with-prefix" key="verification_service_google">
						<span>{ __( 'Google' ) }</span>
						<TextInput
							name="google"
							value={ this.props.value }
							placeholder={ this.props.placeholder }
							className="code"
							disabled={ this.props.disabled }
							onChange={ this.props.onOptionChange }
							onKeyPress={ this.handleOnTextInputKeyPress }
						/>
						{ this.state.inputVisible && (
							<div className="jp-form-site-verification-buttons">
								<Button
									primary
									type="button"
									className="jp-form-site-verification-edit-button"
									disabled={ this.props.disabled }
									onClick={ this.quickSave }
								>
									{ __( 'Save' ) }
								</Button>
								<Button
									type="button"
									className="jp-form-site-verification-edit-button"
									disabled={ this.props.disabled }
									onClick={ this.handleClickCancel }
								>
									{ __( 'Cancel' ) }
								</Button>
							</div>
						) }
					</FormLabel>
				</div>
			);
		}

		if ( this.props.isSiteVerifiedWithGoogle ) {
			return (
				<div>
					<div className="jp-form-input-with-prefix" key="verification_service_google">
						<span>{ __( 'Google' ) }</span>
						<div className="jp-form-site-verification-verified">
							<Gridicon icon="checkmark-circle" size={ 20 } />{' '}
							<span>{ __( 'Your site is verified with Google' ) }</span>
						</div>
						<Button
							type="button"
							className="jp-form-site-verification-edit-button"
							onClick={ this.handleClickEdit }
						>
							{ __( 'Edit' ) }
						</Button>
					</div>

					{ this.props.isOwner && (
						<div className="jp-form-input-with-prefix-bottom-message">
							<div className="jp-form-setting-explanation">
								<p>
									{ __(
										"Monitor your site's traffic and performance from the {{a}}Google Search Console{{/a}}.",
										{
											components: {
												a: (
													<ExternalLink
														icon
														iconSize={ 16 }
														target="_blank"
														rel="noopener noreferrer"
														href={ this.props.googleSearchConsoleUrl }
													/>
												),
											},
										}
									) }{' '}
									{ __(
										'Google will email about certain events that occur with your site, ' +
											'including indications that your website has been {{a1}}hacked{{/a1}}, ' +
											'or problems {{a2}}crawling or indexing{{/a2}} your site.',
										{
											components: {
												a1: (
													<ExternalLink
														icon
														iconSize={ 16 }
														target="_blank"
														rel="noopener noreferrer"
														href={
															'https://developers.google.com/web/fundamentals/security/hacked/'
														}
													/>
												),
												a2: (
													<ExternalLink
														icon
														iconSize={ 16 }
														target="_blank"
														rel="noopener noreferrer"
														href={
															'https://www.google.com/insidesearch/howsearchworks/crawling-indexing.html'
														}
													/>
												),
											},
										}
									) }
								</p>
							</div>
						</div>
					) }
				</div>
			);
		}

		const disabled =
			this.props.fetchingSiteData ||
			this.props.fetchingGoogleSiteVerify ||
			this.props.isVerifyingGoogleSite ||
			this.props.disabled;

		return (
			<div
				className="jp-form-input-with-prefix jp-form-google-label-unverified"
				key="verification_service_google"
			>
				<span>{ __( 'Google' ) }</span>
				<div className="jp-form-google-label-unverified-actions">
					<Button
						primary
						type="button"
						disabled={ disabled }
						onClick={ this.handleClickAutoVerify }
					>
						{ __( 'Verify with Google' ) }
					</Button>
					<span className="jp-form-google-separator">{ __( 'or' ) }</span>
					<Button type="button" disabled={ disabled } onClick={ this.handleClickSetManually }>
						{ __( 'Manually Verify ' ) }
					</Button>
				</div>
			</div>
		);
	}
}

export default connect(
	state => {
		return {
			fetchingSiteData: isFetchingSiteData( state ),
			googleSiteVerificationConnectUrl: getExternalServiceConnectUrl(
				state,
				'google_site_verification'
			),
			googleSearchConsoleUrl: getGoogleSearchConsoleUrl( state ),
			fetchingGoogleSiteVerify: isFetchingGoogleSiteVerify( state ),
			isConnectedToGoogle: isConnectedToGoogleSiteVerificationAPI( state ),
			isSiteVerifiedWithGoogle: isSiteVerifiedWithGoogle( state ),
			isVerifyingGoogleSite: isVerifyingGoogleSite( state ),
			userCanManageOptions: userCanManageOptions( state ),
			googleSiteVerificationError: getGoogleSiteVerificationError( state ),
			isOwner: isGoogleSiteVerificationOwner( state ),
		};
	},
	{
		checkVerifyStatusGoogle,
		createNotice,
		removeNotice,
		verifySiteGoogle,
	}
)( GoogleVerificationServiceComponent );
