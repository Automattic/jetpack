import { ToggleControl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { FormFieldset } from 'components/forms';
import { createNotice, removeNotice } from 'components/global-notices/state/notices/actions';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import QueryAccountProtectionSettings from '../components/data/query-account-protection-settings';
import InfoPopover from '../components/info-popover';
import { FEATURE_JETPACK_ACCOUNT_PROTECTION } from '../lib/plans/constants';
import { updateAccountProtectionSettings } from '../state/account-protection/actions';
import {
	getAccountProtectionSettings,
	isFetchingAccountProtectionSettings,
	isUpdatingAccountProtectionSettings,
} from '../state/account-protection/reducer';

const AccountProtection = class extends Component {
	/**
	 * Get options for initial state.
	 *
	 * @return {object}
	 */
	state = {
		strictMode: this.props.settings?.strictMode,
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
				strictMode: this.props.settings?.strictMode,
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
	 * Toggle strict mode.
	 */
	toggleStrictMode = () => {
		const state = {
			...this.state,
			strictMode: ! this.state.strictMode,
		};

		this.setState( state, this.onSubmit );
	};

	render() {
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
				<SettingsGroup
					hasChild
					disableInOfflineMode
					disableInSiteConnectionMode
					module={ this.props.getModule( 'account-protection' ) }
					support={ {
						text: this.props.getModule( 'account-protection' ).description,
						link: '#', // TODO: Update this redirect URL
					} }
				>
					<ModuleToggle
						slug="account-protection"
						compact
						disabled={ unavailableInOfflineMode }
						activated={ isAccountProtectionActive }
						toggling={ this.props.isSavingAnyOption( 'account-protection' ) }
						toggleModule={ this.props.toggleModuleNow }
					>
						<span className="jp-form-toggle-explanation">
							{ __(
								'Protect your site with enhanced password detection and profile management security.',
								'jetpack'
							) }
						</span>
					</ModuleToggle>
					{ isAccountProtectionActive && (
						<FormFieldset className="account-protection__settings">
							<div className="account-protection__settings__toggle-setting">
								<ToggleControl
									checked={ this.props.settings?.strictMode }
									disabled={ baseInputDisabledCase }
									toggling={
										this.props.isUpdatingAccountProtectionSettings &&
										this.state.strictMode !== this.props.settings?.strictMode
									}
									onChange={ this.toggleStrictMode }
									label={
										<div className="account-protection__settings__toggle-setting__label">
											<span className="jp-form-toggle-explanation">
												{ __( 'Require strong passwords', 'jetpack' ) }
											</span>
											<InfoPopover
												position="right"
												screenReaderText={ __( 'Learn more', 'jetpack' ) }
												className="account-protection__settings__strict-mode-popover"
											>
												{ createInterpolateElement(
													__(
														'Allow Jetpack to enforce strict password rules. <ExternalLink>Learn more</ExternalLink> <hr /> <ExternalLink>Privacy Information</ExternalLink>',
														'jetpack'
													),
													{
														ExternalLink: <ExternalLink href="#" />, // TODO: Update this redirect URL
														hr: <hr />,
													}
												) }
											</InfoPopover>
										</div>
									}
								/>
							</div>
						</FormFieldset>
					) }
				</SettingsGroup>
			</SettingsCard>
		);
	}
};

export default connect(
	state => {
		return {
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
