/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import TextInput from 'components/text-input';
import ExternalLink from 'components/external-link';
import { get, includes } from 'lodash';

/**
 * Internal dependencies
 */
import { FormFieldset, FormLabel } from 'components/forms';
import { ModuleToggle } from 'components/module-toggle';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import JetpackBanner from 'components/jetpack-banner';
import GoogleVerificationService from './verification-services/google';

class VerificationServicesComponent extends React.Component {
	static serviceIds = {
		google: 'google-site-verification',
		bing: 'msvalidate.01',
		pinterest: 'p:domain_verify',
		yandex: 'yandex-verification',
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

		if ( 'inactive' === this.props.getModuleOverride( 'google-analytics' ) ) {
			return (
				<JetpackBanner
					title={ verification.name }
					icon="cog"
					description={ __( '%(moduleName)s has been disabled by a site administrator.', {
						args: {
							moduleName: verification.name,
						},
					} ) }
				/>
			);
		}

		const isVerificationActive = !! this.props.getOptionValue( verification.module );

		return (
			<SettingsCard
				{ ...this.props }
				module={ verification.module }
				saveDisabled={ this.props.isSavingAnyOption( [ 'google', 'bing', 'pinterest', 'yandex' ] ) }
			>
				<SettingsGroup
					module={ verification }
					support={ {
						text: __(
							'Provides the necessary hidden tags needed to verify your WordPress site with various services.'
						),
						link: 'https://jetpack.com/support/site-verification-tools',
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
							{ __( 'Verify your site with various services' ) }
						</span>
					</ModuleToggle>
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
											target="_blank"
											rel="noopener noreferrer"
											href="https://www.google.com/webmasters/tools/"
										/>
									),
									bing: (
										<ExternalLink
											icon={ true }
											target="_blank"
											rel="noopener noreferrer"
											href="https://www.bing.com/webmaster/"
										/>
									),
									pinterest: (
										<ExternalLink
											icon={ true }
											target="_blank"
											rel="noopener noreferrer"
											href="https://pinterest.com/website/verify/"
										/>
									),
									yandex: (
										<ExternalLink
											icon={ true }
											target="_blank"
											rel="noopener noreferrer"
											href="https://webmaster.yandex.com/sites/"
										/>
									),
								},
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
							<span>{ __( 'Bing' ) }</span>
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
							<span>{ __( 'Pinterest' ) }</span>
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
							<span>{ __( 'Yandex' ) }</span>
							<TextInput
								name="yandex"
								value={ this.getSiteVerificationValue( 'yandex' ) }
								placeholder={ this.getMetaTag( 'yandex', '1234' ) }
								className="code"
								disabled={ this.props.isUpdating( 'yandex' ) || ! isVerificationActive }
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
