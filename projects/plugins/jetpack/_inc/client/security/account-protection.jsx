import { ToggleControl } from '@automattic/jetpack-components';
import { __, _x } from '@wordpress/i18n';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { createNotice, removeNotice } from 'components/global-notices/state/notices/actions';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { isModuleFound } from 'state/search';
import QueryAccountProtectionSettings from '../components/data/query-account-protection-settings';
import SimpleNotice from '../components/notice';
import NoticeAction from '../components/notice/notice-action';
import { FEATURE_JETPACK_ACCOUNT_PROTECTION } from '../lib/plans/constants';
import { updateAccountProtectionSettings } from '../state/account-protection/actions';
import {
	getAccountProtectionSettings,
	isFetchingAccountProtectionSettings,
	isUpdatingAccountProtectionSettings,
} from '../state/account-protection/reducer';

const MODULE_NAME = 'account-protection';
const SUPPORT_LINK = 'https://jetpack.com/?post_type=jetpack_support&p=324199';

const AccountProtection = class extends Component {
	/**
	 * Get options for initial state.
	 *
	 * @return {object}
	 */
	state = {
		passwordDetection: this.props.settings?.passwordDetection,
		strongPasswords: this.props.settings?.strongPasswords,
	};

	/**
	 * Keep the form values in sync with updates to the settings prop.
	 *
	 * @param {object} prevProps - Next render props.
	 */
	componentDidUpdate = prevProps => {
		// Sync the form values with the settings prop.
		if ( this.props.settings !== prevProps.settings ) {
			this.setState( {
				...this.state,
				passwordDetection: this.props.settings?.passwordDetection,
				strongPasswords: this.props.settings?.strongPasswords,
			} );
		}
	};

	/**
	 * Handle settings updates.
	 *
	 * @return {void}
	 */
	onSubmit = () => {
		this.props.removeNotice( 'module-setting-update' );
		this.props.removeNotice( 'module-setting-update-success' );

		this.props.createNotice( 'is-info', __( 'Updating settings…', 'jetpack' ), {
			id: 'module-setting-update',
		} );
		this.props
			.updateAccountProtectionSettings( this.state )
			.then( () => {
				this.props.removeNotice( 'module-setting-update' );
				this.props.createNotice( 'is-success', __( 'Updated Settings.', 'jetpack' ), {
					id: 'module-setting-update-success',
				} );
			} )
			.catch( () => {
				this.props.removeNotice( 'module-setting-update' );
				this.props.createNotice( 'is-error', __( 'Error updating settings.', 'jetpack' ), {
					id: 'module-setting-update',
				} );
			} );
	};

	/**
	 * Toggle account protection.
	 */
	toggleAccountProtection = () => {
		this.props.toggleModuleNow( 'account-protection' );
	};

	/**
	 * Toggle password detection.
	 */
	togglePasswordDetection = () => {
		this.setState(
			{ ...this.state, passwordDetection: ! this.state.passwordDetection },
			this.onSubmit
		);
	};

	/**
	 * Toggle strong passwords.
	 */
	toggleStrongPasswords = () => {
		this.setState(
			{ ...this.state, strongPasswords: ! this.state.strongPasswords },
			this.onSubmit
		);
	};

	render() {
		const { isSupported } = this.props;
		const isAccountProtectionActive = this.props.getOptionValue( 'account-protection' ),
			unavailableInOfflineMode = this.props.isUnavailableInOfflineMode( 'account-protection' );
		const baseInputDisabledCase =
			! isAccountProtectionActive ||
			unavailableInOfflineMode ||
			this.props.isFetchingAccountProtectionSettings ||
			this.props.isSavingAnyOption( [ 'account-protection' ] );

		return (
			<SettingsCard
				{ ...this.props }
				module="account-protection"
				header={ _x( 'Account protection', 'Settings header', 'jetpack' ) }
				hideButton={ true }
				feature={ FEATURE_JETPACK_ACCOUNT_PROTECTION }
			>
				{ isAccountProtectionActive && <QueryAccountProtectionSettings /> }
				{ ! isSupported && (
					<SimpleNotice
						status={ 'is-info' }
						showDismiss={ false }
						text={ __(
							'This feature has been disabled by your site administrator or hosting provider.',
							'jetpack'
						) }
						children={
							<NoticeAction external href={ SUPPORT_LINK + '#unsupported-environments' }>
								{ __( 'Learn more', 'jetpack' ) }
							</NoticeAction>
						}
					/>
				) }
				{ isSupported && ! isAccountProtectionActive && (
					<SimpleNotice
						showDismiss={ false }
						status={ 'is-info' }
						text={ __( 'Jetpack recommends enabling this feature.', 'jetpack' ) }
						children={
							<NoticeAction onClick={ this.toggleAccountProtection }>
								{ __( 'Activate', 'jetpack' ) }
							</NoticeAction>
						}
					/>
				) }
				<SettingsGroup
					hasChild
					disableInOfflineMode
					disableInSiteConnectionMode
					module={ this.props.getModule( MODULE_NAME ) }
					support={ {
						text: __(
							'Enabling these settings enhances account security by detecting compromised passwords and enforcing additional verification when needed.',
							'jetpack'
						),
						link: SUPPORT_LINK,
					} }
				>
					<p className="jp-form-toggle-explanation">
						{ __(
							'Protect your site with enhanced password detection and profile management security.',
							'jetpack'
						) }
					</p>
					{ isAccountProtectionActive && (
						<div className="account-protection__settings">
							<div className="account-protection__settings__toggle-setting">
								<ToggleControl
									checked={ this.props.settings?.passwordDetection }
									disabled={ baseInputDisabledCase }
									toggling={
										this.props.isUpdatingAccountProtectionSettings &&
										this.state.passwordDetection !== this.props.settings?.passwordDetection
									}
									onChange={ this.togglePasswordDetection }
									label={
										<div className="account-protection__settings__toggle-setting__label">
											<span className="jp-form-toggle-explanation">
												{ __(
													'Detect and prevent the use of compromised passwords that have been exposed in data breaches',
													'jetpack'
												) }
											</span>
										</div>
									}
								/>
							</div>
							<div className="account-protection__settings__toggle-setting">
								<ToggleControl
									checked={ this.props.settings?.strongPasswords }
									disabled={ baseInputDisabledCase }
									toggling={
										this.props.isUpdatingAccountProtectionSettings &&
										this.state.strongPasswords !== this.props.settings?.strongPasswords
									}
									onChange={ this.toggleStrongPasswords }
									label={
										<div className="account-protection__settings__toggle-setting__label">
											<span className="jp-form-toggle-explanation">
												{ __(
													'Enforce strong password requirements for all users to enhance account security',
													'jetpack'
												) }
											</span>
										</div>
									}
								/>
							</div>
						</div>
					) }
				</SettingsGroup>
			</SettingsCard>
		);
	}
};

export default connect(
	state => {
		return {
			isSupported: isModuleFound( state, MODULE_NAME ),
			isFetchingSettings: isFetchingAccountProtectionSettings( state ),
			isUpdatingAccountProtectionSettings: isUpdatingAccountProtectionSettings( state ),
			settings: getAccountProtectionSettings( state ),
		};
	},
	dispatch => {
		return {
			updateAccountProtectionSettings: newSettings =>
				dispatch( updateAccountProtectionSettings( newSettings ) ),
			createNotice: ( type, message, props ) => dispatch( createNotice( type, message, props ) ),
			removeNotice: notice => dispatch( removeNotice( notice ) ),
		};
	}
)( withModuleSettingsFormHelpers( AccountProtection ) );
