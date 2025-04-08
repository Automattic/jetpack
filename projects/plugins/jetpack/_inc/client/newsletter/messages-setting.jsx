import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import { connect } from 'react-redux';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { FEATURE_NEWSLETTER_JETPACK } from 'lib/plans/constants';
import { isUnavailableInOfflineMode, hasConnectedOwner } from 'state/connection';
import { getModule } from 'state/modules';
import Textarea from '../components/textarea';
import { SUBSCRIPTIONS_MODULE_NAME } from './constants';

const SUBSCRIPTION_OPTIONS = 'subscription_options';

const MessagesSetting = props => {
	const {
		isSubscriptionsActive,
		isSavingAnyOption,
		subscriptionsModule,
		onOptionChange,
		welcomeMessage,
		unavailableInOfflineMode,
		siteHasConnectedUser,
	} = props;

	const changeWelcomeMessageState = useCallback(
		event => {
			const subscriptionOptionEvent = {
				target: { name: event.target.name, value: { welcome: event.target.value } },
			};
			onOptionChange( subscriptionOptionEvent );
		},
		[ onOptionChange ]
	);

	const isSaving = isSavingAnyOption( [ SUBSCRIPTION_OPTIONS ] );
	const disabled =
		! siteHasConnectedUser || ! isSubscriptionsActive || unavailableInOfflineMode || isSaving;

	return (
		<SettingsCard
			{ ...props }
			header={ __( 'Welcome email message', 'jetpack' ) }
			feature={ FEATURE_NEWSLETTER_JETPACK }
			module={ SUBSCRIPTIONS_MODULE_NAME }
			saveDisabled={ isSaving }
			isDisabled={ disabled }
		>
			<SettingsGroup
				hasChild
				disableInOfflineMode
				disableInSiteConnectionMode={ ! siteHasConnectedUser }
				module={ subscriptionsModule }
			>
				<p className="jp-settings-card__email-settings">
					{ __(
						'Sent to your email subscribers when they subscribe to your newsletter.',
						'jetpack'
					) }
				</p>
				<Textarea
					aria-label={ __( 'Welcome email message', 'jetpack' ) }
					disabled={ disabled }
					name={ SUBSCRIPTION_OPTIONS }
					value={ welcomeMessage }
					onChange={ changeWelcomeMessageState }
				/>
				<p className="jp-form-setting-explanation">
					{ __(
						'You can use plain text or HTML tags in this textarea for formatting.',
						'jetpack'
					) }
				</p>
			</SettingsGroup>
		</SettingsCard>
	);
};

export default withModuleSettingsFormHelpers(
	connect( ( state, ownProps ) => {
		return {
			isSubscriptionsActive: ownProps.getOptionValue( SUBSCRIPTIONS_MODULE_NAME ),
			subscriptionsModule: getModule( state, SUBSCRIPTIONS_MODULE_NAME ),
			isSavingAnyOption: ownProps.isSavingAnyOption,
			moduleName: ownProps.moduleName,
			onOptionChange: ownProps.onOptionChange,
			welcomeMessage: ownProps.getOptionValue( SUBSCRIPTION_OPTIONS )?.welcome || '',
			unavailableInOfflineMode: isUnavailableInOfflineMode( state, SUBSCRIPTIONS_MODULE_NAME ),
			siteHasConnectedUser: hasConnectedOwner( state ),
		};
	} )( MessagesSetting )
);
