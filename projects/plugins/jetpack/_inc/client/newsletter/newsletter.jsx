import { getRedirectUrl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import Card from 'components/card';
import ConnectUserBar from 'components/connect-user-bar';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import analytics from 'lib/analytics';
import React from 'react';
import { connect } from 'react-redux';
import { isCurrentUserLinked, isUnavailableInOfflineMode, isOfflineMode } from 'state/connection';
import { getModule } from 'state/modules';
import { SUBSCRIPTIONS_MODULE_NAME } from './constants';

const trackViewSubsClick = () => {
	analytics.tracks.recordJetpackClick( 'manage-subscribers' );
};

/**
 * Newsletter component.
 *
 * @param {object} props - Component props.
 * @returns {React.Component} Newsletter component.
 */
function Newsletter( props ) {
	const {
		siteRawUrl,
		blogID,
		toggleModuleNow,
		isSavingAnyOption,
		isLinked,
		isOffline,
		isSubscriptionsActive,
		unavailableInOfflineMode,
		subscriptions,
	} = props;

	const getSubClickableCard = () => {
		if ( unavailableInOfflineMode || ! isSubscriptionsActive || ! isLinked ) {
			return '';
		}

		return (
			<Card
				compact
				className="jp-settings-card__configure-link"
				onClick={ trackViewSubsClick }
				href={ getRedirectUrl( 'jetpack-settings-jetpack-manage-subscribers', {
					site: blogID ?? siteRawUrl,
				} ) }
				target="_blank"
				rel="noopener noreferrer"
			>
				{ __( 'Manage all subscribers', 'jetpack' ) }
			</Card>
		);
	};

	return (
		<SettingsCard
			{ ...props }
			header={ __( 'Newsletter', 'jetpack' ) }
			hideButton
			module={ SUBSCRIPTIONS_MODULE_NAME }
		>
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
					toggling={ isSavingAnyOption( SUBSCRIPTIONS_MODULE_NAME ) }
					toggleModule={ toggleModuleNow }
				>
					<span className="jp-form-toggle-explanation">
						{ __( 'Let visitors subscribe to this site', 'jetpack' ) }
					</span>
				</ModuleToggle>
			</SettingsGroup>

			{ getSubClickableCard() }

			{ ! isLinked && ! isOffline && (
				<ConnectUserBar
					feature="subscriptions"
					featureLabel={ __( 'Newsletter', 'jetpack' ) }
					text={ __( 'Connect to manage your subscriptions settings.', 'jetpack' ) }
				/>
			) }
		</SettingsCard>
	);
}

export default withModuleSettingsFormHelpers(
	connect( ( state, ownProps ) => {
		return {
			isLinked: isCurrentUserLinked( state ),
			isOffline: isOfflineMode( state ),
			isSubscriptionsActive: ownProps.getOptionValue( SUBSCRIPTIONS_MODULE_NAME ),
			unavailableInOfflineMode: isUnavailableInOfflineMode( state, SUBSCRIPTIONS_MODULE_NAME ),
			subscriptions: getModule( state, SUBSCRIPTIONS_MODULE_NAME ),
		};
	} )( Newsletter )
);
