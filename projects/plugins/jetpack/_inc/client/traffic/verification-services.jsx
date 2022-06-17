import { getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { FormFieldset, FormLabel } from 'components/forms';
import JetpackBanner from 'components/jetpack-banner';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import TextInput from 'components/text-input';
import { get, includes } from 'lodash';
import React from 'react';
import GoogleVerificationService from './verification-services/google';

class VerificationServicesComponent extends React.Component {
	static serviceIds = {
		google: 'google-site-verification',
		bing: 'msvalidate.01',
		pinterest: 'p:domain_verify',
		yandex: 'yandex-verification',
		facebook: 'facebook-domain-verification',
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
		if ( optionValue === this.props.getSettingCurrentValue( service ) ) {
			return this.getMetaTag( service, optionValue );
		}

		return optionValue;
	}

	render() {
		const verification = this.props.getModule( 'verification-tools' );

		if ( 'inactive' === this.props.getModuleOverride( 'verification-tools' ) ) {
			return (
				<JetpackBanner
					title={ verification.name }
					icon="cog"
					description={ sprintf(
						/* translators: placeholder is a feature name. */
						__( '%s has been disabled by a site administrator.', 'jetpack' ),
						verification.name
					) }
				/>
			);
		}

		const isVerificationActive = !! this.props.getOptionValue( verification.module );

		return (
			<SettingsCard
				{ ...this.props }
				module={ verification.module }
				saveDisabled={ this.props.isSavingAnyOption( [
					'google',
					'bing',
					'pinterest',
					'yandex',
					'facebook',
				] ) }
			>
				<SettingsGroup
					module={ verification }
					support={ {
						text: __(
							'Provides the necessary hidden tags needed to verify your WordPress site with various services.',
							'jetpack'
						),
						link: getRedirectUrl( 'jetpack-support-site-verification-tools' ),
					} }
				>
					<ModuleToggle
						slug={ verification.module }
						activated={ isVerificationActive }
						toggling={ this.props.isSavingAnyOption( [ verification.module ] ) }
						disabled={ this.props.isSavingAnyOption( [ verification.module ] ) }
						toggleModule={ this.props.toggleModuleNow }
					>
						<span className="jp-form-toggle-explanation">
							{ __( 'Verify site ownership with third party services', 'jetpack' ) }
						</span>
					</ModuleToggle>
					<p>
						{ createInterpolateElement(
							/* translators: placeholders are links to external sites. */
							__(
								'Note that <b>verifying your site with these services is not necessary</b> in order for your site to be indexed by search engines. To use these advanced search engine tools and verify your site with a service, paste the HTML Tag code below. Read the <support>full instructions</support> if you are having trouble. Supported verification services: <google>Google Search Console</google>, <bing>Bing Webmaster Center</bing>, <pinterest>Pinterest Site Verification</pinterest>, <yandex>Yandex.Webmaster</yandex>, and <facebook>Facebook Domain Verification</facebook>.',
								'jetpack'
							),
							{
								b: <strong />,
								support: <a href={ getRedirectUrl( 'jetpack-support-site-verification-tools' ) } />,
								google: (
									<ExternalLink
										rel="noopener noreferrer"
										href="https://www.google.com/webmasters/tools/"
									/>
								),
								bing: (
									<ExternalLink rel="noopener noreferrer" href="https://www.bing.com/webmaster/" />
								),
								pinterest: (
									<ExternalLink
										rel="noopener noreferrer"
										href="https://pinterest.com/website/verify/"
									/>
								),
								yandex: (
									<ExternalLink
										rel="noopener noreferrer"
										href="https://webmaster.yandex.com/sites/"
									/>
								),
								facebook: (
									<ExternalLink
										rel="noopener noreferrer"
										href="https://business.facebook.com/settings/"
									/>
								),
							}
						) }
					</p>
					<FormFieldset>
						<GoogleVerificationService
							value={ this.getSiteVerificationValue( 'google' ) }
							placeholder={ this.getMetaTag( 'google', '1234' ) }
							{ ...this.props }
							disabled={ this.props.isUpdating( 'google' ) || ! isVerificationActive }
						/>
						<FormLabel className="jp-form-input-with-prefix" key="verification_service_bing">
							<span>{ __( 'Bing', 'jetpack' ) }</span>
							<TextInput
								name="bing"
								value={ this.getSiteVerificationValue( 'bing' ) }
								placeholder={ this.getMetaTag( 'bing', '1234' ) }
								className="code"
								disabled={ this.props.isUpdating( 'bing' ) || ! isVerificationActive }
								onChange={ this.props.onOptionChange }
							/>
						</FormLabel>
						<FormLabel className="jp-form-input-with-prefix" key="verification_service_pinterest">
							<span>{ __( 'Pinterest', 'jetpack' ) }</span>
							<TextInput
								name="pinterest"
								value={ this.getSiteVerificationValue( 'pinterest' ) }
								placeholder={ this.getMetaTag( 'pinterest', '1234' ) }
								className="code"
								disabled={ this.props.isUpdating( 'pinterest' ) || ! isVerificationActive }
								onChange={ this.props.onOptionChange }
							/>
						</FormLabel>
						<FormLabel className="jp-form-input-with-prefix" key="verification_service_yandex">
							<span>{ __( 'Yandex', 'jetpack' ) }</span>
							<TextInput
								name="yandex"
								value={ this.getSiteVerificationValue( 'yandex' ) }
								placeholder={ this.getMetaTag( 'yandex', '1234' ) }
								className="code"
								disabled={ this.props.isUpdating( 'yandex' ) || ! isVerificationActive }
								onChange={ this.props.onOptionChange }
							/>
						</FormLabel>
						<FormLabel className="jp-form-input-with-prefix" key="verification_service_facebook">
							<span>{ __( 'Facebook', 'jetpack' ) }</span>
							<TextInput
								name="facebook"
								value={ this.getSiteVerificationValue( 'facebook' ) }
								placeholder={ this.getMetaTag( 'facebook', '1234' ) }
								className="code"
								disabled={ this.props.isUpdating( 'facebook' ) || ! isVerificationActive }
								onChange={ this.props.onOptionChange }
							/>
						</FormLabel>
					</FormFieldset>
				</SettingsGroup>
			</SettingsCard>
		);
	}
}

export const VerificationServices = withModuleSettingsFormHelpers( VerificationServicesComponent );
