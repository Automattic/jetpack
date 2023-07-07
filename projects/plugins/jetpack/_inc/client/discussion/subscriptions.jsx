import { ToggleControl, getRedirectUrl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import Card from 'components/card';
import ConnectUserBar from 'components/connect-user-bar';
import { FormFieldset } from 'components/forms';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import analytics from 'lib/analytics';
import React from 'react';
import { connect } from 'react-redux';
import { isSubscriptionModalEnabled } from 'state/initial-state';

class SubscriptionsComponent extends React.Component {
	/**
	 * Get options for initial state.
	 *
	 * @returns {{stb_enabled: *, stc_enabled: *, sm_enabled: *}} initial state for the component.
	 */
	getInitialState = () => {
		return {
			stb_enabled: this.props.getOptionValue( 'stb_enabled' ),
			stc_enabled: this.props.getOptionValue( 'stc_enabled' ),
			sm_enabled: this.props.getOptionValue( 'sm_enabled' ),
		};
	};

	constructor( props ) {
		super( props );
		this.state = this.getInitialState();
	}

	/**
	 * Update state so toggles are updated.
	 *
	 * @param {string} optionName - the slug of the option to update.
	 */
	updateOptions = optionName => {
		this.setState(
			{
				[ optionName ]: ! this.state[ optionName ],
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

	handleSubscribeModalToggleChange = () => {
		this.updateOptions( 'sm_enabled' );
	};

	render() {
		const subscriptions = this.props.getModule( 'subscriptions' ),
			isSubscriptionsActive = this.props.getOptionValue( 'subscriptions' ),
			unavailableInOfflineMode = this.props.isUnavailableInOfflineMode( 'subscriptions' );

		const getSubClickableCard = () => {
			if ( unavailableInOfflineMode || ! isSubscriptionsActive || ! this.props.isLinked ) {
				return '';
			}

			return (
				<Card
					compact
					className="jp-settings-card__configure-link"
					onClick={ this.trackConfigureClick }
					href={ getRedirectUrl( 'calypso-people-email-followers', {
						site: this.props.siteRawUrl,
					} ) }
					target="_blank"
					rel="noopener noreferrer"
				>
					{ __( 'View your Email Subscribers', 'jetpack' ) }
				</Card>
			);
		};

		return (
			<SettingsCard { ...this.props } hideButton module="subscriptions">
				<SettingsGroup
					hasChild
					disableInOfflineMode
					disableInSiteConnectionMode
					module={ subscriptions }
					support={ {
						text: __(
							'Allows readers to subscribe to your posts or comments, and receive notifications of new content by email.',
							'jetpack'
						),
						link: getRedirectUrl( 'jetpack-support-subscriptions' ),
					} }
				>
					<ModuleToggle
						slug="subscriptions"
						disabled={ unavailableInOfflineMode }
						activated={ isSubscriptionsActive }
						toggling={ this.props.isSavingAnyOption( 'subscriptions' ) }
						toggleModule={ this.props.toggleModuleNow }
					>
						<span className="jp-form-toggle-explanation">{ subscriptions.description }</span>
					</ModuleToggle>
					{
						<FormFieldset>
							<ToggleControl
								checked={ isSubscriptionsActive && this.props.getOptionValue( 'stb_enabled' ) }
								disabled={
									! isSubscriptionsActive ||
									unavailableInOfflineMode ||
									this.props.isSavingAnyOption( [ 'subscriptions' ] )
								}
								toggling={ this.props.isSavingAnyOption( [ 'stb_enabled' ] ) }
								onChange={ this.handleSubscribeToBlogToggleChange }
								label={ __(
									'Enable the “subscribe to site” option on your comment form',
									'jetpack'
								) }
							/>
							<ToggleControl
								checked={ isSubscriptionsActive && this.props.getOptionValue( 'stc_enabled' ) }
								disabled={
									! isSubscriptionsActive ||
									unavailableInOfflineMode ||
									this.props.isSavingAnyOption( [ 'subscriptions' ] )
								}
								toggling={ this.props.isSavingAnyOption( [ 'stc_enabled' ] ) }
								onChange={ this.handleSubscribeToCommentToggleChange }
								label={ __(
									'Enable the “subscribe to comments” option on your comment form',
									'jetpack'
								) }
							/>
							{ this.props.isSubscriptionModalEnabled && (
								<ToggleControl
									checked={ isSubscriptionsActive && this.props.getOptionValue( 'sm_enabled' ) }
									disabled={
										! isSubscriptionsActive ||
										unavailableInOfflineMode ||
										this.props.isSavingAnyOption( [ 'subscriptions' ] )
									}
									toggling={ this.props.isSavingAnyOption( [ 'sm_enabled' ] ) }
									onChange={ this.handleSubscribeModalToggleChange }
									label={ __( 'Enableeee the popup subscription modal', 'jetpack' ) }
								/>
							) }
						</FormFieldset>
					}
				</SettingsGroup>
				{ getSubClickableCard() }

				{ ! this.props.isLinked && ! this.props.isOfflineMode && (
					<ConnectUserBar
						feature="subscriptions"
						featureLabel={ __( 'Subscriptions', 'jetpack' ) }
						text={ __( 'Connect to manage your subscriptions settings.', 'jetpack' ) }
					/>
				) }
			</SettingsCard>
		);
	}
}

export const UnwrappedComponent = SubscriptionsComponent;
export default withModuleSettingsFormHelpers(
	connect( state => {
		return {
			isSubscriptionModalEnabled: isSubscriptionModalEnabled( state ),
		};
	} )( SubscriptionsComponent )
);
