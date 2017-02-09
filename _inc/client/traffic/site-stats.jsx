/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import FormToggle from 'components/form/form-toggle';
import includes from 'lodash/includes';
import filter from 'lodash/filter';

/**
 * Internal dependencies
 */
import {
	FormFieldset,
	FormLegend
} from 'components/forms';
import { ModuleToggle } from 'components/module-toggle';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import InlineExpand from 'components/inline-expand';

export const SiteStats = moduleSettingsForm(
	React.createClass( {

		/**
		 * Get options for initial state.
		 *
		 * @returns {{count_roles: *, roles: *, count_roles_administrator, count_roles_editor, count_roles_author, count_roles_contributor, count_roles_subscriber, roles_administrator: boolean, roles_editor, roles_author, roles_contributor, roles_subscriber}}
		 */
		getInitialState() {
			let countRoles = this.props.getOptionValue( 'count_roles', 'stats' ),
				roles = this.props.getOptionValue( 'roles', 'stats' );
			return {
				count_roles: countRoles,
				roles: roles,

				count_roles_administrator: includes( countRoles, 'administrator', false ),
				count_roles_editor: includes( countRoles, 'editor', false ),
				count_roles_author: includes( countRoles, 'author', false ),
				count_roles_contributor: includes( countRoles, 'contributor', false ),
				count_roles_subscriber: includes( countRoles, 'subscriber', false ),

				roles_administrator: true,
				roles_editor: includes( roles, 'editor', false ),
				roles_author: includes( roles, 'author', false ),
				roles_contributor: includes( roles, 'contributor', false ),
				roles_subscriber: includes( roles, 'subscriber', false )
			};
		},

		/**
		 * Update state so toggles are updated.
		 *
		 * @param {string} optionName
		 * @param {string} optionSet
		 */
		updateOptions( optionName, optionSet ) {
			let value = this.props.getOptionValue( optionSet, 'stats' );
			if ( ! this.state[ `${optionSet}_${optionName}` ] ) {
				if ( ! includes( value, optionName ) ) {
					value.push( optionName );
				}
			} else {
				if ( includes( value, optionName ) ) {
					value = filter( value, item => {
						return item !== optionName;
					} );
				}
			}

			this.setState(
				{
					[ `${optionSet}_${optionName}` ]: ! this.state[ `${optionSet}_${optionName}` ]
				},
				() => {
					this.props.updateOptions( {
						[ optionSet ]: value
					} );
				}
			);
		},

		render() {
			let stats = this.props.getModule( 'stats' ),
				isStatsActive = this.props.getOptionValue( 'stats' ),
				unavailableInDevMode = this.props.isUnavailableInDevMode( 'stats' ),
				siteRoles = this.props.getSiteRoles();
			return (
				<SettingsCard
					{ ...this.props }
					hideButton
					header={ __( 'Site stats' ) }
					module="stats">
					<SettingsGroup disableInDevMode module={ stats }>
						<FormFieldset>
							<ModuleToggle
								slug="stats"
								compact
								disabled={ ! isStatsActive || unavailableInDevMode }
								activated={ !!this.props.getOptionValue( 'admin_bar' ) }
								toggling={ this.props.isSavingAnyOption( [ 'stats', 'admin_bar' ] ) }
								toggleModule={ m => this.props.updateFormStateModuleOption( m, 'admin_bar' ) }
							>
								<span className="jp-form-toggle-explanation">
									{
										__( 'Put a chart showing 48 hours of views in the admin bar' )
									}
								</span>
							</ModuleToggle>
							<ModuleToggle
								slug="stats"
								compact
								disabled={ ! isStatsActive || unavailableInDevMode }
								activated={ !!this.props.getOptionValue( 'hide_smile' ) }
								toggling={ this.props.isSavingAnyOption( [ 'stats', 'hide_smile' ] ) }
								toggleModule={ m => this.props.updateFormStateModuleOption( m, 'hide_smile' ) }
							>
								<span className="jp-form-toggle-explanation">
									{
										__( 'Hide the stats smiley face image (The image helps collect stats, but should work when hidden.)' )
									}
								</span>
							</ModuleToggle>
						</FormFieldset>
						<InlineExpand label={ __( 'Advanced Options' ) }>
							<div>
								<FormFieldset>
									<FormLegend>{ __( 'Registered Users: Count the page views of registered users who are logged in' ) }</FormLegend>
									{
										Object.keys( siteRoles ).map( key => (
											<FormToggle
												compact
												checked={ this.state[ `count_roles_${key}` ] }
												disabled={ ! isStatsActive || unavailableInDevMode || this.props.isSavingAnyOption( [ 'stats', 'count_roles' ] ) }
												onChange={ e => this.updateOptions( key, 'count_roles' ) }
												key={ `count_roles-${key}` }>
												<span className="jp-form-toggle-explanation">
													{ siteRoles[ key ].name }
												</span>
											</FormToggle>
										) )
									}
								</FormFieldset>
								<FormFieldset>
									<FormLegend>{ __( 'Report Visibility: Select the roles that will be able to view stats reports' ) }</FormLegend>
									<FormToggle
										compact
										checked={ true }
										disabled={ true }>
										<span className="jp-form-toggle-explanation">
											{ siteRoles.administrator.name }
										</span>
									</FormToggle>
									{
										Object.keys( siteRoles ).map( key => (
											( 'administrator' !== key ) && (
												<FormToggle
													compact
													checked={ this.state[ `roles_${key}` ] }
													disabled={ ! isStatsActive || unavailableInDevMode || this.props.isSavingAnyOption( [ 'stats', 'roles' ] ) }
													onChange={ e => this.updateOptions( key, 'roles' ) }
													key={ `roles-${key}` }>
													<span className="jp-form-toggle-explanation">
														{ siteRoles[ key ].name }
													</span>
												</FormToggle>
											)
										) )
									}
								</FormFieldset>
							</div>
						</InlineExpand>
					</SettingsGroup>
				</SettingsCard>
			);
		}
	} )
);
