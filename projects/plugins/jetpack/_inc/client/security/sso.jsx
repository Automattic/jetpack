import { getRedirectUrl } from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import { Button, ToggleControl } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import { Link } from '@wordpress/ui';
import * as cookie from 'cookie';
import { useState, Component } from 'react';
import ReactDOM from 'react-dom';
import { FormFieldset } from 'components/forms';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { FEATURE_SSO } from '../lib/plans/constants';

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
					<Button
						onClick={ onClose } // eslint-disable-line react/jsx-no-bind
						className="modal-survey-notice__popup-head-close"
						icon={ close }
						iconSize={ 16 }
						label={ __( 'Close', 'jetpack' ) }
					/>
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
		 * @return {{jetpack_sso_match_by_email: *, jetpack_sso_require_two_step: *}}
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
			const isSSOActive = this.props.getOptionValue( 'sso' );
			const unavailableInOfflineMode = this.props.isUnavailableInOfflineMode( 'sso' );
			const isTwoStepEnforced =
				!! this.props.getModule( 'sso' )?.options?.jetpack_sso_require_two_step?.default;

			return (
				<>
					<SettingsCard
						{ ...this.props }
						hideButton
						module="sso"
						header={ _x( 'WordPress.com login', 'Settings header, noun.', 'jetpack' ) }
						feature={ FEATURE_SSO }
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
								disabled={
									unavailableInOfflineMode ||
									! this.props.hasConnectedOwner ||
									this.props.isSavingAnyOption( 'sso' )
								}
								activated={ isSSOActive }
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
									__nextHasNoMarginBottom={ true }
									checked={
										isSSOActive &&
										this.props.getOptionValue( 'jetpack_sso_match_by_email', 'sso', false )
									}
									disabled={
										! isSSOActive ||
										unavailableInOfflineMode ||
										this.props.isSavingAnyOption( [ 'sso' ] )
									}
									onChange={ this.handleMatchByEmailToggleChange }
									label={
										<span className="jp-form-toggle-explanation">
											{ __( 'Match accounts using email addresses', 'jetpack' ) }
										</span>
									}
								/>
								<ToggleControl
									__nextHasNoMarginBottom={ true }
									checked={
										( isSSOActive &&
											this.props.getOptionValue( 'jetpack_sso_require_two_step', 'sso', false ) ) ||
										isTwoStepEnforced
									}
									disabled={
										! isSSOActive ||
										unavailableInOfflineMode ||
										isTwoStepEnforced ||
										this.props.isSavingAnyOption( [ 'sso' ] )
									}
									onChange={ this.handleTwoStepToggleChange }
									label={
										<span className="jp-form-toggle-explanation">
											{ __(
												'Require accounts to use WordPress.com Two-Step Authentication',
												'jetpack'
											) }
										</span>
									}
									help={
										isTwoStepEnforced
											? createInterpolateElement(
													__(
														'Two-Step Authentication is enforced because the <code>jetpack_sso_require_two_step</code> filter is active. <link>Learn more</link>.',
														'jetpack'
													),
													{
														link: (
															<Link
																openInNewTab
																href={ getRedirectUrl( 'jetpack-support-force-2fa' ) }
															/>
														),
														code: <code />,
													}
											  )
											: null
									}
								/>
							</FormFieldset>
						</SettingsGroup>
					</SettingsCard>
					{ this.state.showSSODisableModal &&
						ReactDOM.createPortal( <SSOSurveyNotice />, document.body ) }
				</>
			);
		}
	}
);
