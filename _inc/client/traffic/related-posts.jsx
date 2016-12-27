/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import ExternalLink from 'components/external-link';

/**
 * Internal dependencies
 */
import { ModuleToggle } from 'components/module-toggle';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import SettingsCard from 'components/settings-card';

export const RelatedPosts = moduleSettingsForm(
	React.createClass( {

		toggleModule( name, value ) {
			this.props.updateFormStateOptionValue( name, !value );
		},

		render() {
			return (
				<SettingsCard
					{ ...this.props }
					module="related-posts">
					<ModuleToggle slug={ 'related-posts' }
								  compact
								  activated={ this.props.getOptionValue( 'related-posts' ) }
								  toggling={ this.props.isSavingAnyOption() }
								  toggleModule={ this.toggleModule }>
						<span className="jp-form-toggle-explanation">
							{
								__( 'Use Jetpack comments. Let readers use their WordPress.com,	Twitter, Facebook or Google+ to leave comments on your posts and pages.' )
							}
						</span>
					</ModuleToggle>
					{
						this.props.getOptionValue( 'related-posts' )
							? (
								<p>
									<ExternalLink className="jp-module-settings__external-link" icon={ true } iconSize={ 16 } href={ this.props.configureUrl }>{ __( 'Configure your Related Posts settings.' ) }</ExternalLink>
								</p>
							  )
							: ''
					}
				</SettingsCard>
			);
		}
	} )
);
