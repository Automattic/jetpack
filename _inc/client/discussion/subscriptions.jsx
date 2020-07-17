/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import CompactFormToggle from 'components/form/form-toggle/compact';
import Card from 'components/card';
import { FormFieldset } from 'components/forms';
import getRedirectUrl from 'lib/jp-redirect';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';

class SubscriptionsComponent extends React.Component {
	/**
	 * Get options for initial state.
	 *
	 * @returns {{stb_enabled: *, stc_enabled: *}}
	 */
	state = {
		stb_enabled: this.props.getOptionValue( 'stb_enabled', 'subscriptions' ),
		stc_enabled: this.props.getOptionValue( 'stc_enabled', 'subscriptions' ),
	};

	/**
	 * Update state so toggles are updated.
	 *
	 * @param {string} optionName the slug of the option to update
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

	render() {
		const subscriptions = this.props.getModule( 'subscriptions' ),
			isSubscriptionsActive = this.props.getOptionValue( 'subscriptions' ),
			unavailableInDevMode = this.props.isUnavailableInDevMode( 'subscriptions' );

		const getSubClickableCard = () => {
			if ( unavailableInDevMode || ! isSubscriptionsActive ) {
				return '';
			}

			return this.props.isLinked ? (
				<Card
					compact
					className="jp-settings-card__configure-link"
					onClick={ this.trackConfigureClick }
					href={ getRedirectUrl( 'calypso-people-email-followers', {
						site: this.props.siteRawUrl,
					} ) }
				>
					{ __( 'View your Email Followers', 'jetpack' ) }
				</Card>
			) : (
				<Card
					compact
					className="jp-settings-card__configure-link"
					href={ `${ this.props.connectUrl }&from=unlinked-user-connect-masterbar` }
				>
					{ __( 'Create a Jetpack account to view your email followers', 'jetpack' ) }{ ' ' }
				</Card>
			);
		};

		return (
			<SettingsCard { ...this.props } hideButton module="subscriptions">
				<SettingsGroup
					hasChild
					disableInDevMode
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
						disabled={ unavailableInDevMode }
						activated={ isSubscriptionsActive }
						toggling={ this.props.isSavingAnyOption( 'subscriptions' ) }
						toggleModule={ this.props.toggleModuleNow }
					>
						<span className="jp-form-toggle-explanation">{ subscriptions.description }</span>
					</ModuleToggle>
					{
						<FormFieldset>
							<CompactFormToggle
								checked={ this.state.stb_enabled }
								disabled={
									! isSubscriptionsActive ||
									unavailableInDevMode ||
									this.props.isSavingAnyOption( [ 'subscriptions', 'stb_enabled' ] )
								}
								onChange={ this.handleSubscribeToBlogToggleChange }
							>
								<span className="jp-form-toggle-explanation">
									{ __( 'Enable the “subscribe to site” option on your comment form', 'jetpack' ) }
								</span>
							</CompactFormToggle>
							<CompactFormToggle
								checked={ this.state.stc_enabled }
								disabled={
									! isSubscriptionsActive ||
									unavailableInDevMode ||
									this.props.isSavingAnyOption( [ 'subscriptions', 'stc_enabled' ] )
								}
								onChange={ this.handleSubscribeToCommentToggleChange }
							>
								<span className="jp-form-toggle-explanation">
									{ __(
										'Enable the “subscribe to comments” option on your comment form',
										'jetpack'
									) }
								</span>
							</CompactFormToggle>
						</FormFieldset>
					}
				</SettingsGroup>
				{ getSubClickableCard() }
			</SettingsCard>
		);
	}
}

export const Subscriptions = withModuleSettingsFormHelpers( SubscriptionsComponent );
