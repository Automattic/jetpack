/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import TextInput from 'components/text-input';
import ExternalLink from 'components/external-link';

/**
 * Internal dependencies
 */
import {
	FormFieldset,
	FormLabel
} from 'components/forms';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import JetpackBanner from 'components/jetpack-banner';

class VerificationServicesComponent extends React.Component {
	activateVerificationTools = () => {
		return this.props.updateOptions( { 'verification-tools': true } );
	};

	render() {
		const verification = this.props.getModule( 'verification-tools' );

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
						{
							[
								{
									id: 'google',
									label: __( 'Google' ),
									placeholder: '<meta name="google-site-verification" content="1234" />'
								},
								{
									id: 'bing',
									label: __( 'Bing' ),
									placeholder: '<meta name="msvalidate.01" content="1234" />'
								},
								{
									id: 'pinterest',
									label: __( 'Pinterest' ),
									placeholder: '<meta name="p:domain_verify" content="1234" />'
								},
								{
									id: 'yandex',
									label: __( 'Yandex' ),
									placeholder: '<meta name="yandex-verification" content="1234" />'
								}
							].map( item => (
								<FormLabel
									className="jp-form-input-with-prefix"
									key={ `verification_service_${ item.id }` }>
									<span>{ item.label }</span>
									<TextInput
										name={ item.id }
										value={ this.props.getOptionValue( item.id ) }
										placeholder={ item.placeholder }
										className="code"
										disabled={ this.props.isUpdating( item.id ) }
										onChange={ this.props.onOptionChange } />
								</FormLabel>
							) )
						}
					</FormFieldset>
				</SettingsGroup>
			</SettingsCard>
		);
	}
}

export const VerificationServices = moduleSettingsForm( VerificationServicesComponent );
