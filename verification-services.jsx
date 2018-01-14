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

export const VerificationServices = moduleSettingsForm(
	React.createClass( {
		render() {
			const verification = this.props.getModule( 'verification-tools' );
			return (
				<SettingsCard
					{ ...this.props }
					module="verification-tools"
					saveDisabled={ this.props.isSavingAnyOption( [ 'google', 'bing', 'pinterest', 'yandex' ] ) }
				>
					<SettingsGroup module={ verification } support={ verification.learn_more_button }>
						<p>
							{ __(
								'Note that {{b}}verifying your site with these services is not necessary{{/b}} in order for your site to be indexed by search engines. To use these advanced search engine tools and verify your site with a service, copy and paste the {{b}}content{{/b}} value of your meta key below. Read the {{support}}full instructions{{/support}} if you are having trouble. Supported verification services: {{google}}Google Search Console{{/google}}, {{bing}}Bing Webmaster Center{{/bing}}, {{pinterest}}Pinterest Site Verification{{/pinterest}}, and {{yandex}}Yandex.Webmaster{{/yandex}}.',
								{
									components: {
										b: <strong />,
										support: <a href="https://jetpack.com/support/site-verification-tools/" />,
										google: (
											<ExternalLink
												icon={ true }
												target="_blank"
												href="https://www.google.com/webmasters/tools/"
											/>
										),
										bing: (
											<ExternalLink
												icon={ true }
												target="_blank"
												href="https://www.bing.com/webmaster/"
											/>
										),
										pinterest: (
											<ExternalLink
												icon={ true }
												target="_blank"
												href="https://pinterest.com/website/verify/"
											/>
										),
										yandex: (
											<ExternalLink
												icon={ true }
												target="_blank"
												href="https://webmaster.yandex.com/sites/"
											/>
										)
									}
								} 
									<Text>
									  <Text>Meta key example: <meta name = 'google-site-verification' content =   </Text>
									  <Text style={{fontWeight: "bold"}}> dBw5CvburAxi537Rp9qi5uG2174Vb6JwHwIRwPSLIK8 </Text>
									  <Text> > </Text>
									</Text>

							) }
						</p>


						<FormFieldset>
							{
								[
									{
										id: 'google',
										label: __( 'Google' ),
										placeholder: 'Example: dBw5CvburAxi537Rp9qi5uG2174Vb6JwHwIRwPSLIK8'
									},
									{
										id: 'bing',
										label: __( 'Bing' ),
										placeholder: 'Example: dBw5CvburAxi537Rp9qi5uG2174Vb6JwHwIRwPSLIK8'
									},
									{
										id: 'pinterest',
										label: __( 'Pinterest' ),
										placeholder: 'Example: dBw5CvburAxi537Rp9qi5uG2174Vb6JwHwIRwPSLIK8'
									},
									{
										id: 'yandex',
										label: __( 'Yandex' ),
										placeholder: 'Example: dBw5CvburAxi537Rp9qi5uG2174Vb6JwHwIRwPSLIK8'
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
											onChange={ this.props.onOptionChange} />
									</FormLabel>
								) )
							}
						</FormFieldset>
					</SettingsGroup>
				</SettingsCard>
			);
		}
	} )
);
