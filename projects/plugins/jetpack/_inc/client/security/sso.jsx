import { getRedirectUrl, ToggleControl, Gridicon } from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import { Button } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import ConnectUserBar from 'components/connect-user-bar';
import { FormFieldset } from 'components/forms';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import cookie from 'cookie';
import { useState, Component } from 'react';
import ReactDOM from 'react-dom';

const SSOSurveyNotice = () => {
	const { userConnectionData } = useConnection();
	const userId = userConnectionData?.currentUser?.wpcomUser?.ID;
	const href = `https://wordpressdotcom.survey.fm/disable-sso-survey?initiated-from=jetpack&user-id=${ userId }`;
	const [ hideNotice, setHideNotice ] = useState(
		'dismissed' === cookie.parse( document.cookie )?.sso_disable
	);

	const setSSOSurveyCookie = ( value, maxAge ) => {
		document.cookie = cookie.serialize( 'sso_disable', value, {
			path: '/',
			maxAge,
		} );
	};

	const onClose = () => {
		setSSOSurveyCookie( 'dismissed', 365 * 24 * 60 * 60 ); // 1 year
		setHideNotice( true );
	};

	if ( hideNotice ) {
		return null;
	}

	return (
		<div className="modal-survey-notice">
			{ /* eslint-disable-next-line react/jsx-no-bind */ }
			<Button className="modal-survey-notice__backdrop" onClick={ onClose } />
			<div className="modal-survey-notice__popup">
				<div className="modal-survey-notice__popup-head">
					<div className="modal-survey-notice__popup-head-title">
						{ __( 'SSO Survey', 'jetpack' ) }
					</div>
					{ /* eslint-disable-next-line react/jsx-no-bind */ }
					<Button onClick={ onClose } className="modal-survey-notice__popup-head-close">
						<Gridicon icon="cross" size={ 16 } />
					</Button>
				</div>
				<div className="modal-survey-notice__popup-content">
					<div className="modal-survey-notice__popup-content-title">
						{ __( 'Hi there!', 'jetpack' ) }
					</div>
					<div className="modal-survey-notice__popup-content-description">
						{ __(
							"Spare a moment? We'd love to hear why you want to disable SSO in a quick survey.",
							'jetpack'
						) }
					</div>
					<div className="modal-survey-notice__popup-content-buttons">
						<Button
							className="modal-survey-notice__popup-content-buttons-cancel"
							onClick={ onClose } // eslint-disable-line react/jsx-no-bind
						>
							{ __( 'Remind later', 'jetpack' ) }
						</Button>
						<Button
							className="modal-survey-notice__popup-content-buttons-ok"
							href={ href }
							target="_blank"
							rel="noopener noreferrer"
							onClick={ onClose } // eslint-disable-line react/jsx-no-bind
						>
							{ __( 'Take survey', 'jetpack' ) }
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};

export const SSO = withModuleSettingsFormHelpers(
	class extends Component {
		/**
		 * Get options for initial state.
		 *
		 * @returns {{jetpack_sso_match_by_email: *, jetpack_sso_require_two_step: *}}
		 */
		state = {
			jetpack_sso_match_by_email: this.props.getOptionValue(
				'jetpack_sso_match_by_email',
				'sso',
				false
			),
			jetpack_sso_require_two_step: this.props.getOptionValue(
				'jetpack_sso_require_two_step',
				'sso',
				false
			),
			showSSODisableModal: false,
		};

		handleTwoStepToggleChange = () => {
			this.updateOptions( 'jetpack_sso_require_two_step' );
		};

		handleMatchByEmailToggleChange = () => {
			this.updateOptions( 'jetpack_sso_match_by_email' );
		};

		/**
		 * Update state so toggles are updated.
		 *
		 * @param {string} optionName - The slug of the option to update
		 */
		updateOptions = optionName => {
			this.setState(
				{
					[ optionName ]: ! this.state[ optionName ],
				},
				this.props.updateFormStateModuleOption( 'sso', optionName )
			);
		};

		render() {
			const isSSOActive = this.props.getOptionValue( 'sso' ),
				unavailableInOfflineMode = this.props.isUnavailableInOfflineMode( 'sso' );
			return (
				<>
					<SettingsCard
						{ ...this.props }
						hideButton
						module="sso"
						header={ _x( 'WordPress.com login', 'Settings header, noun.', 'jetpack' ) }
					>
						<SettingsGroup
							hasChild
							disableInOfflineMode
							disableInSiteConnectionMode
							module={ this.props.getModule( 'sso' ) }
							support={ {
								text: __(
									'Allows registered users to log in to your site with their WordPress.com accounts.',
									'jetpack'
								),
								link: getRedirectUrl( 'jetpack-support-sso' ),
							} }
						>
							<p>
								{ __(
									'Add an extra layer of security to your website by enabling WordPress.com login and secure authentication. If you have multiple sites with this option enabled, you will be able to log in to every one of them with the same credentials.',
									'jetpack'
								) }
							</p>
							<ModuleToggle
								slug="sso"
								disabled={ unavailableInOfflineMode || ! this.props.hasConnectedOwner }
								activated={ isSSOActive }
								toggling={ this.props.isSavingAnyOption( 'sso' ) }
								// eslint-disable-next-line react/jsx-no-bind
								toggleModule={ name => {
									if ( isSSOActive ) {
										this.setState( { showSSODisableModal: true } );
									}
									this.props.toggleModuleNow( name );
								} }
							>
								<span className="jp-form-toggle-explanation">
									{ this.props.getModule( 'sso' ).description }
								</span>
							</ModuleToggle>
							<FormFieldset>
								<ToggleControl
									checked={
										isSSOActive &&
										this.props.getOptionValue( 'jetpack_sso_match_by_email', 'sso', false )
									}
									disabled={
										! isSSOActive ||
										unavailableInOfflineMode ||
										this.props.isSavingAnyOption( [ 'sso' ] )
									}
									toggling={ this.props.isSavingAnyOption( [ 'jetpack_sso_match_by_email' ] ) }
									onChange={ this.handleMatchByEmailToggleChange }
									label={ __( 'Match accounts using email addresses', 'jetpack' ) }
								/>
								<ToggleControl
									checked={
										isSSOActive &&
										this.props.getOptionValue( 'jetpack_sso_require_two_step', 'sso', false )
									}
									disabled={
										! isSSOActive ||
										unavailableInOfflineMode ||
										this.props.isSavingAnyOption( [ 'sso' ] )
									}
									toggling={ this.props.isSavingAnyOption( [ 'jetpack_sso_require_two_step' ] ) }
									onChange={ this.handleTwoStepToggleChange }
									label={ __(
										'Require accounts to use WordPress.com Two-Step Authentication',
										'jetpack'
									) }
								/>
							</FormFieldset>
						</SettingsGroup>

						{ ! this.props.hasConnectedOwner && ! this.props.isOfflineMode && (
							<ConnectUserBar
								feature="sso"
								featureLabel={ __( 'Secure Sign-On', 'jetpack' ) }
								text={ __( 'Connect to enable WordPress.com Secure Sign-On.', 'jetpack' ) }
							/>
						) }
					</SettingsCard>
					{ this.state.showSSODisableModal &&
						ReactDOM.createPortal( <SSOSurveyNotice />, document.body ) }
				</>
			);
		}
	}
);
