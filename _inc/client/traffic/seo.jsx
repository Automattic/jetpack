/**
 * External dependencies
 */
import analytics from 'lib/analytics';
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import ExternalLink from 'components/external-link';

/**
 * Internal dependencies
 */
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import SettingsCard from 'components/settings-card';

export const SEO = moduleSettingsForm(
	React.createClass( {

		toggleModule( name, value ) {
			this.props.updateFormStateOptionValue( name, !value );
		},

		render() {
			return (
				<SettingsCard
					{ ...this.props }
					header={ __( 'Search Engine Optimization', { context: 'Settings header' } ) }
					support="https://jetpack.com/support/seo-tools/"
					hideButton>
					<p>
						{
							__( "You can tweak these settings if you'd like more advanced control. Read more about what you can do to {{a}}optimize your site's SEO{{/a}}.",
								{
									components: {
										a: <a href="https://jetpack.com/support/seo-tools/" />
									}
								}
							)
						}
					</p>
					<p>
						<ExternalLink className="jp-module-settings__external-link" icon={ true } iconSize={ 16 } href={ this.props.configureUrl }>{ __( 'Configure your SEO settings.' ) }</ExternalLink>
					</p>
				</SettingsCard>
			);
		}
	} )
);
