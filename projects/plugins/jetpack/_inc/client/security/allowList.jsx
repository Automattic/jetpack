import { ToggleControl } from '@automattic/jetpack-components';
import { __, _x, sprintf } from '@wordpress/i18n';
import { includes } from 'lodash';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import Button from 'components/button';
import { FormFieldset } from 'components/forms';
import { createNotice, removeNotice } from 'components/global-notices/state/notices/actions';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import QueryWafSettings from '../components/data/query-waf-bootstrap-path';
import Textarea from '../components/textarea';
import { updateWafSettings } from '../state/waf/actions';
import { getWafSettings, isFetchingWafSettings, isUpdatingWafSettings } from '../state/waf/reducer';

const AllowList = class extends Component {
	/**
	 * Get options for initial state.
	 *
	 * @return {object}
	 */
	state = {
		ipAllowListEnabled: this.props.settings?.ipAllowListEnabled,
		ipAllowList: this.props.settings?.ipAllowList,
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
				ipAllowListEnabled: this.props.settings?.ipAllowListEnabled,
				ipAllowList: this.props.settings?.ipAllowList,
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
			.updateWafSettings( this.state )
			.then( () => {
				this.props.removeNotice( 'module-setting-update' );
				this.props.createNotice( 'is-success', __( 'Updated Settings.', 'jetpack' ), {
					id: 'module-setting-update-success',
				} );
			} )
			.catch( error => {
				this.props.removeNotice( 'module-setting-update' );
				this.props.createNotice(
					'is-error',
					sprintf(
						/* translators: placeholder is an error code or an error message. */
						__( 'Error updating settings. %s', 'jetpack' ),
						error.message || error.code
					),
					{
						id: 'module-setting-update',
					}
				);
			} );
	};

	/**
	 * Toggle IP allow list.
	 */
	toggleIpAllowList = () => {
		this.setState(
			{ ...this.state, ipAllowListEnabled: ! this.state.ipAllowListEnabled },
			this.onSubmit
		);
	};

	/**
	 * Handle IP allow list change.
	 *
	 * @param {Event} event - = The event object.
	 */
	handleIpAllowListChange = event => {
		this.setState( { ...this.state, ipAllowList: event?.target?.value } );
	};

	currentIpIsSafelisted = () => {
		// get current IP allow list in textarea from this.state.ipAllowList;
		return !! includes( this.state.ipAllowList, this.props.currentIp );
	};

	addToSafelist = () => {
		const newAllowList =
			this.state.ipAllowList +
			( 0 >= this.state.ipAllowList.length ? '' : '\n' ) +
			this.props.currentIp;

		// Update the allow list
		this.setState( { ...this.state, ipAllowList: newAllowList } );
	};

	render() {
		const wafUnavailableInOfflineMode = this.props.isUnavailableInOfflineMode( 'waf' );
		const protectUnavailableInOfflineMode = this.props.isUnavailableInOfflineMode( 'protect' );
		const baseInputDisabledCase =
			( wafUnavailableInOfflineMode && protectUnavailableInOfflineMode ) ||
			this.props.isFetchingWafSettings ||
			this.props.isSavingAnyOption( [ 'waf' ] );

		const moduleHeader = (
			<div className="waf__header">
				<span>{ _x( 'Always allowed IP addresses', 'Settings header', 'jetpack' ) }</span>
			</div>
		);

		return (
			<SettingsCard
				{ ...this.props }
				header={ moduleHeader }
				module="waf"
				onSubmit={ this.onSubmit }
				hideButton={ true }
			>
				<QueryWafSettings />
				<SettingsGroup
					disableInOfflineMode
					support={ {
						text: "Adding an IP address to the allow list will prevent it from being blocked by Jetpack's firewall and brute force protection features.",
						link: this.props.getModule( 'waf' ).learn_more_button,
					} }
				>
					<FormFieldset>
						<div className="waf__settings__toggle-setting">
							<ToggleControl
								checked={ this.props.settings?.ipAllowListEnabled }
								toggling={
									this.props.isUpdatingWafSettings &&
									this.state.ipAllowListEnabled !== this.props.settings?.ipAllowListEnabled
								}
								disabled={ baseInputDisabledCase }
								onChange={ this.toggleIpAllowList }
								label={
									<span className="jp-form-toggle-explanation">
										{ __(
											"Prevent Jetpack's security features from blocking specific IP addresses.",
											'jetpack'
										) }
									</span>
								}
							/>
							{ ( this.state.ipAllowListEnabled || !! this.state.ipAllowList ) && (
								<Textarea
									className="waf__settings__ips"
									disabled={
										baseInputDisabledCase ||
										this.props.isUpdatingWafSettings ||
										! this.props.settings?.ipAllowListEnabled
									}
									name="ipAllowList"
									placeholder={ __( 'Example:', 'jetpack' ) + '\n12.12.12.1\n12.12.12.2' }
									value={ this.state.ipAllowList }
									onChange={ this.handleIpAllowListChange }
								/>
							) }
							{ this.state.ipAllowListEnabled && (
								<div className="waf__settings__ips__button-container">
									{ this.props.currentIp && (
										<div className="current-ip">
											<div className="jp-form-label-wide">
												{ sprintf(
													/* translators: placeholder is an IP address. */
													__( 'Your current IP: %s', 'jetpack' ),
													this.props.currentIp
												) }
											</div>
											{
												<Button
													rna
													compact
													disabled={
														this.props.isUpdatingWafSettings ||
														! this.props.settings?.ipAllowListEnabled ||
														this.currentIpIsSafelisted() ||
														this.props.isSavingAnyOption( [ 'jetpack_waf_ip_allow_list' ] )
													}
													onClick={ this.addToSafelist }
												>
													{ __( 'Add to Allow List', 'jetpack' ) }
												</Button>
											}
										</div>
									) }
									<Button
										primary
										rna
										compact
										type="button"
										className="waf__settings__ips__save-button"
										disabled={
											this.state.ipAllowList === this.props.settings?.ipAllowList ||
											( this.props.isUpdatingWafSettings &&
												this.state.ipAllowList !== this.props.settings?.ipAllowList )
										}
										onClick={ this.onSubmit }
									>
										{ __( 'Save allow list', 'jetpack' ) }
									</Button>
								</div>
							) }
						</div>
					</FormFieldset>
				</SettingsGroup>
			</SettingsCard>
		);
	}
};

export default connect(
	state => {
		return {
			isFetchingSettings: isFetchingWafSettings( state ),
			isUpdatingWafSettings: isUpdatingWafSettings( state ),
			settings: getWafSettings( state ),
		};
	},
	dispatch => {
		return {
			updateWafSettings: newSettings => dispatch( updateWafSettings( newSettings ) ),
			createNotice: ( type, message, props ) => dispatch( createNotice( type, message, props ) ),
			removeNotice: notice => dispatch( removeNotice( notice ) ),
		};
	}
)( withModuleSettingsFormHelpers( AllowList ) );
