/**
 * External dependencies
 */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import CompactFormToggle from 'components/form/form-toggle/compact';

/**
 * Internal dependencies
 */
import ExternalLink from 'components/external-link';
import { FormFieldset } from 'components/forms';
import { ModuleToggle } from 'components/module-toggle';
import {
	withModuleSettingsFormHelpers as withModuleSettingsFormHelpers,
} from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';

class SSO extends Component {
	handleTwoStepToggleChange = () => {
		const messages = {
			error: () => __( 'An unexpected error occured while setting up 2-step authentication. {{a}}Please try again{{/a}}',
				{
					components: {
						a: <ExternalLink target="_blank" rel="noopener noreferrer" href="https://wordpress.com/me/security/two-step" />
					}
				}
			)
		};
		this.props.updateOptions( { jetpack_sso_require_two_step: ! this.props.requireTwoStepAuth }, messages );
	}

	handleMatchByEmailToggleChange = () => {
		this.props.updateOptions( { jetpack_sso_match_by_email: ! this.props.matchByEmail } );
	}

	render() {
		const isSSOActive = this.props.getOptionValue( 'sso' ),
			unavailableInDevMode = this.props.isUnavailableInDevMode( 'sso' );
		return (
			<SettingsCard
				{ ...this.props }
				hideButton
				module="sso"
				header={ __( 'WordPress.com log in', { context: 'Settings header' } ) }
			>
				<SettingsGroup
					hasChild
					disableInDevMode
					module={ this.props.getModule( 'sso' ) }
					support={ {
						text: __( 'Allows registered users to log in to your site with their WordPress.com accounts.' ),
						link: 'https://jetpack.com/support/sso/',
					} }
					>
					<p>
						{ __(
						'Add an extra layer of security to your website by enabling WordPress.com log in and secure ' +
						'authentication. If you have multiple sites with this option enabled, you will be able to log into every ' +
						'one of them with the same credentials.'
						) }
					</p>
					<ModuleToggle
						slug="sso"
						disabled={ unavailableInDevMode }
						activated={ isSSOActive }
						toggling={ this.props.isSavingAnyOption( 'sso' ) }
						toggleModule={ this.props.toggleModuleNow }
					>
						<span className="jp-form-toggle-explanation">
							{ this.props.getModule( 'sso' ).description }
						</span>
					</ModuleToggle>
					<FormFieldset>
						<CompactFormToggle
							checked={ this.props.matchByEmail }
							disabled={
								! isSSOActive ||
									unavailableInDevMode ||
									this.props.isSavingAnyOption( [ 'sso', 'jetpack_sso_match_by_email' ] )
							}
							onChange={ this.handleMatchByEmailToggleChange }
						>
							<span className="jp-form-toggle-explanation">
								{ __( 'Match accounts using email addresses' ) }
							</span>
						</CompactFormToggle>
						<CompactFormToggle
							checked={ this.props.requireTwoStepAuth }
							disabled={
								! isSSOActive ||
									unavailableInDevMode ||
									this.props.isSavingAnyOption( [ 'sso', 'jetpack_sso_require_two_step' ] )
							}
							onChange={ this.handleTwoStepToggleChange }
						>
							<span className="jp-form-toggle-explanation">
								{ __( 'Require accounts to use WordPress.com Two-Step Authentication' ) }
							</span>
						</CompactFormToggle>
					</FormFieldset>
				</SettingsGroup>
			</SettingsCard>
		);
	}
}

export default withModuleSettingsFormHelpers( connect(
	( state, ownProps ) => ( {
		matchByEmail: ownProps.getOptionValue(
			'jetpack_sso_match_by_email',
			'sso'
		),
		requireTwoStepAuth: ownProps.getOptionValue(
			'jetpack_sso_require_two_step',
			'sso'
		),
	} )
)( SSO ) );
