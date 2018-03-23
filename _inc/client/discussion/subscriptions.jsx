/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import CompactFormToggle from 'components/form/form-toggle/compact';
import Card from 'components/card';
import analytics from 'lib/analytics';

/**
 * Internal dependencies
 */
import { FormFieldset } from 'components/forms';
import { ModuleToggle } from 'components/module-toggle';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';

class SubscriptionsComponent extends React.Component {
    /**
	 * Get options for initial state.
	 *
	 * @returns {{stb_enabled: *, stc_enabled: *}}
	 */
	state = {
		stb_enabled: this.props.getOptionValue( 'stb_enabled', 'subscriptions' ),
		stc_enabled: this.props.getOptionValue( 'stc_enabled', 'subscriptions' )
	};

	/**
	 * Update state so toggles are updated.
	 *
	 * @param {string} optionName the slug of the option to update
	 */
	updateOptions = optionName => {
		this.setState(
			{
				[ optionName ]: ! this.state[ optionName ]
			},
			this.props.updateFormStateModuleOption( 'subscriptions', optionName )
		);
	};

	trackConfigureClick = () => {
		analytics.tracks.recordJetpackClick( 'view-followers' );
	};

	handleSubscribeToBlogToggleChange = () => {
		this.updateOptions( 'stb_enabled' );
	};

	handleSubscribeToCommentToggleChange = () => {
		this.updateOptions( 'stc_enabled' );
	};

	render() {
		const subscriptions = this.props.getModule( 'subscriptions' ),
			isSubscriptionsActive = this.props.getOptionValue( 'subscriptions' ),
			unavailableInDevMode = this.props.isUnavailableInDevMode( 'subscriptions' );

		const getSubClickableCard = () => {
			if ( unavailableInDevMode || ! isSubscriptionsActive ) {
				return '';
			}

			return this.props.isLinked
				? <Card compact className="jp-settings-card__configure-link" onClick={ this.trackConfigureClick } href={ 'https://wordpress.com/people/email-followers/' + this.props.siteRawUrl }>{ __( 'View your Email Followers' ) }</Card>
				: <Card compact className="jp-settings-card__configure-link" href={ `${ this.props.connectUrl }&from=unlinked-user-connect-masterbar` }>{ __( 'Connect your user account to WordPress.com to view your email followers' ) } </Card>;
		};

		return (
			<SettingsCard
				{ ...this.props }
				hideButton
				module="subscriptions">
				<SettingsGroup
					hasChild
					disableInDevMode
					module={ subscriptions }
					support={ {
						text: __( 'Allows readers to subscribe to your posts or comments, ' +
							'and receive notifications of new content by email.' ),
						link: 'https://jetpack.com/support/subscriptions/',
					} }
					>
					<ModuleToggle
						slug="subscriptions"
						disabled={ unavailableInDevMode }
						activated={ isSubscriptionsActive }
						toggling={ this.props.isSavingAnyOption( 'subscriptions' ) }
						toggleModule={ this.props.toggleModuleNow }>
					<span className="jp-form-toggle-explanation">
						{
							subscriptions.description
						}
					</span>
					</ModuleToggle>
					{
						<FormFieldset>
							<CompactFormToggle
								checked={ this.state.stb_enabled }
								disabled={ ! isSubscriptionsActive || unavailableInDevMode || this.props.isSavingAnyOption( [ 'subscriptions', 'stb_enabled' ] ) }
								onChange={ this.handleSubscribeToBlogToggleChange }>
								<span className="jp-form-toggle-explanation">
									{
										__( 'Show a "follow blog" option in the comment form' )
									}
								</span>
							</CompactFormToggle>
							<CompactFormToggle
								checked={ this.state.stc_enabled }
								disabled={ ! isSubscriptionsActive || unavailableInDevMode || this.props.isSavingAnyOption( [ 'subscriptions', 'stc_enabled' ] ) }
								onChange={ this.handleSubscribeToCommentToggleChange }>
								<span className="jp-form-toggle-explanation">
									{
										__( 'Show a "follow comments" option in the comment form' )
									}
								</span>
							</CompactFormToggle>
						</FormFieldset>
					}
				</SettingsGroup>
				{
					getSubClickableCard()
				}
			</SettingsCard>
		);
	}
}

export const Subscriptions = moduleSettingsForm( SubscriptionsComponent );
