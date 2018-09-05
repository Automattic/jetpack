/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import TextInput from 'components/text-input';
import ExternalLink from 'components/external-link';
import get from 'lodash/get';
import includes from 'lodash/includes';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import {
	isFetchingSiteData,
} from 'state/site';
import {
	FormFieldset,
	FormLabel
} from 'components/forms';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import JetpackBanner from 'components/jetpack-banner';
import Gridicon from 'components/gridicon';
import Button from 'components/button';
import { getSiteID } from 'state/site/reducer';
// eslint-disable-next-line no-unused-vars
import requestExternalAccess from 'lib/sharing';
import { getExternalServiceConnectUrl } from 'state/publicize/reducer';
import {
	checkVerifyStatusGoogle,
	verifySiteGoogle,
	isFetchingGoogleSiteVerify,
	isConnectedToGoogleSiteVerificationAPI,
	isSiteVerifiedWithGoogle,
	isVerifyingGoogleSite
} from 'state/site-verify';
import { userCanManageOptions } from 'state/initial-state';

class VerificationServicesComponent extends React.Component {
	static serviceIds = {
		google: 'google-site-verification',
		bing: 'msvalidate.01',
		pinterest: 'p:domain_verify',
		yandex: 'yandex-verification',
	};

	activateVerificationTools = () => {
		return this.props.updateOptions( { 'verification-tools': true } );
	};

	getMetaTag( serviceName = '', content = '' ) {
		if ( ! content ) {
			return '';
		}

		if ( ! /^[a-z0-9_-]+$/i.test( content ) ) {
			// User is probably editing the content
			return content;
		}

		if ( includes( content, '<meta' ) ) {
			// We were passed a meta tag already!
			return content;
		}

		return `<meta name="${ get(
			VerificationServicesComponent.serviceIds,
			serviceName,
			''
		) }" content="${ content }" />`;
	}

	getSiteVerificationValue( service ) {
		const optionValue = this.props.getOptionValue( service );
		// if current value is equal to the initial value, update format for display
		if ( ! this.props.isDirty() ) {
			return this.getMetaTag( service, optionValue );
		}

		return optionValue;
	}

	componentWillMount() {
		this.checkVerifySite();
	}

	checkVerifySite() {
		this.props.checkVerifyStatusGoogle().then( ( { token } ) => {
			if ( token !== this.props.getSettingCurrentValue( 'google' ) ) {
				return this.props.updateOptions( { google: token } );
			}
		} ).then( () => {
			if ( ! this.props.isSiteVerifiedWithGoogle ) {
				this.props.verifySiteGoogle();
			}
		} ).catch( () => {
			// ignore error
		} );
	}

	handleClickGoogleVerify = () => {
		if ( this.props.fetchingSiteData || this.props.fetchingGoogleSiteVerify ) {
			return;
		}

		if ( ! this.props.isConnectedToGoogle ) {
			requestExternalAccess( this.props.googleSiteVerificationConnectUrl, () => {
				this.checkVerifySite();
			} );
			return;
		}

		this.checkVerifySite();
	};

	renderGoogleVerifyButton() {
		if ( ! this.props.userCanManageOptions ) {
			return null;
		}

		const disabled = this.props.fetchingSiteData || this.props.fetchingGoogleSiteVerify || this.props.isSiteVerifiedWithGoogle;

		if ( this.props.isVerifyingGoogleSite ) {
			return (
				<span className="jp-form-input-suffix">
					{ __( 'Verifying...' ) }
				</span>
			);
		} else if ( ! this.props.isConnectedToGoogle ) {
			return (
				<Button className="jp-form-input-suffix" type="button" disabled={ disabled } onClick={ this.handleClickGoogleVerify }>
					{ __( 'Connect with Google' ) }
				</Button>
			);
		} else if ( this.props.isSiteVerifiedWithGoogle ) {
			return (
				<span className="jp-form-input-suffix jp-form-suffix-site-verification-verified">
					<Gridicon icon="checkmark-circle" size={ 20 } />
					{ ' ' }
					{ __( 'Your site is verified with Google' ) }
				</span>
			);
		}

		return (
			<Button className="jp-form-input-suffix" type="button" disabled={ disabled } onClick={ this.handleClickGoogleVerify }>
				{ __( 'Click to Verify' ) }
			</Button>
		);
	}

	render() {
		const verification = this.props.getModule( 'verification-tools' );

		if ( 'inactive' === this.props.getModuleOverride( 'google-analytics' ) ) {
			return (
				<JetpackBanner
					title={ verification.name }
					icon="cog"
					description={ __( '%(moduleName)s has been disabled by a site administrator.', {
						args: {
							moduleName: verification.name
						}
					} ) }
				/>
			);
		}

		// Show one-way activation banner if not active
		if ( ! this.props.getOptionValue( 'verification-tools' ) ) {
			return (
				<JetpackBanner
					callToAction={ __( 'Activate' ) }
					title={ verification.name }
					icon="cog"
					description={ verification.long_description }
					onClick={ this.activateVerificationTools }
				/>
			);
		}

		return (
			<SettingsCard
				{ ...this.props }
				module="verification-tools"
				saveDisabled={ this.props.isSavingAnyOption( [ 'google', 'bing', 'pinterest', 'yandex' ] ) }
			>
				<SettingsGroup
					module={ verification }
					support={ {
						text: __( 'Provides the necessary hidden tags needed to verify your WordPress site with various services.' ),
						link: 'https://jetpack.com/support/site-verification-tools',
					} }
					>
					<p>
						{ __(
							'Note that {{b}}verifying your site with these services is not necessary{{/b}} in order for your site to be indexed by search engines. To use these advanced search engine tools and verify your site with a service, paste the HTML Tag code below. Read the {{support}}full instructions{{/support}} if you are having trouble. Supported verification services: {{google}}Google Search Console{{/google}}, {{bing}}Bing Webmaster Center{{/bing}}, {{pinterest}}Pinterest Site Verification{{/pinterest}}, and {{yandex}}Yandex.Webmaster{{/yandex}}.',
							{
								components: {
									b: <strong />,
									support: <a href="https://jetpack.com/support/site-verification-tools/" />,
									google: (
										<ExternalLink
											icon={ true }
											target="_blank" rel="noopener noreferrer"
											href="https://www.google.com/webmasters/tools/"
										/>
									),
									bing: (
										<ExternalLink
											icon={ true }
											target="_blank" rel="noopener noreferrer"
											href="https://www.bing.com/webmaster/"
										/>
									),
									pinterest: (
										<ExternalLink
											icon={ true }
											target="_blank" rel="noopener noreferrer"
											href="https://pinterest.com/website/verify/"
										/>
									),
									yandex: (
										<ExternalLink
											icon={ true }
											target="_blank" rel="noopener noreferrer"
											href="https://webmaster.yandex.com/sites/"
										/>
									)
								}
							}
						) }
					</p>
					<FormFieldset>
						<FormLabel
							className="jp-form-input-with-prefix"
							key="verification_service_google">
							<span>{ __( 'Google' ) }</span>
							<TextInput
								name="google"
								value={ this.getSiteVerificationValue( 'google' ) }
								placeholder={ this.getMetaTag( 'google', '1234' ) }
								className="code"
								disabled={ this.props.isUpdating( 'google' ) || this.props.isSiteVerifiedWithGoogle }
								onChange={ this.props.onOptionChange } />
							{ this.renderGoogleVerifyButton() }
						</FormLabel>
						<FormLabel
							className="jp-form-input-with-prefix"
							key="verification_service_bing">
							<span>{ __( 'Bing' ) }</span>
							<TextInput
								name="bing"
								value={ this.getSiteVerificationValue( 'bing' ) }
								placeholder={ this.getMetaTag( 'bing', '1234' ) }
								className="code"
								disabled={ this.props.isUpdating( 'bing' ) }
								onChange={ this.props.onOptionChange } />
						</FormLabel>
						<FormLabel
							className="jp-form-input-with-prefix"
							key="verification_service_pinterest">
							<span>{ __( 'Pinterest' ) }</span>
							<TextInput
								name="pinterest"
								value={ this.getSiteVerificationValue( 'pinterest' ) }
								placeholder={ this.getMetaTag( 'pinterest', '1234' ) }
								className="code"
								disabled={ this.props.isUpdating( 'pinterest' ) }
								onChange={ this.props.onOptionChange } />
						</FormLabel>
						<FormLabel
							className="jp-form-input-with-prefix"
							key="verification_service_yandex">
							<span>{ __( 'Yandex' ) }</span>
							<TextInput
								name="yandex"
								value={ this.getSiteVerificationValue( 'yandex' ) }
								placeholder={ this.getMetaTag( 'yandex', '1234' ) }
								className="code"
								disabled={ this.props.isUpdating( 'yandex' ) }
								onChange={ this.props.onOptionChange } />
						</FormLabel>
					</FormFieldset>
				</SettingsGroup>
			</SettingsCard>
		);
	}
}

export const VerificationServices = connect(
	state => {
		return {
			fetchingSiteData: isFetchingSiteData( state ),
			siteID: getSiteID( state ),
			googleSiteVerificationConnectUrl: getExternalServiceConnectUrl( state, 'google_site_verification' ),
			fetchingGoogleSiteVerify: isFetchingGoogleSiteVerify( state ),
			isConnectedToGoogle: isConnectedToGoogleSiteVerificationAPI( state ),
			isSiteVerifiedWithGoogle: isSiteVerifiedWithGoogle( state ),
			isVerifyingGoogleSite: isVerifyingGoogleSite( state ),
			userCanManageOptions: userCanManageOptions( state )
		};
	},
	{
		checkVerifyStatusGoogle,
		verifySiteGoogle,
	}
)( moduleSettingsForm( VerificationServicesComponent ) );
