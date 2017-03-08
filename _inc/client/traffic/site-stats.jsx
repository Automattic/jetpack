/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import CompactFormToggle from 'components/form/form-toggle/compact';
import FoldableCard from 'components/foldable-card';
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
			if ( ! this.state[ `${ optionSet }_${ optionName }` ] ) {
				if ( ! includes( value, optionName ) ) {
					value.push( optionName );
				}
			} else if ( includes( value, optionName ) ) {
				value = filter( value, item => {
					return item !== optionName;
				} );
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
			const stats = this.props.getModule( 'stats' ),
				isStatsActive = this.props.getOptionValue( 'stats' ),
				unavailableInDevMode = this.props.isUnavailableInDevMode( 'stats' ),
				siteRoles = this.props.getSiteRoles();
			return (
				<FoldableCard
					clickableHeader={ true }
					subheader={ __( 'Site stats options' ) }
				>
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
								disabled={ ! isStatsActive || unavailableInDevMode }
								activated={ !! this.props.getOptionValue( 'hide_smile' ) }
								toggling={ this.props.isSavingAnyOption( [ 'stats', 'hide_smile' ] ) }
								toggleModule={ m => this.props.updateFormStateModuleOption( m, 'hide_smile' ) }
							>
								<span className="jp-form-toggle-explanation">
									{
										__( 'Hide the stats smiley face image' )
									}
								</span>
								<span className="jp-form-setting-explanation">
									{
										__( 'The image helps collect stats, but should work when hidden.' )
									}
								</span>
							</ModuleToggle>
						</FormFieldset>
						<FormFieldset>
							<FormLegend>{ __( 'Count logged in page views from' ) }</FormLegend>
							{
								Object.keys( siteRoles ).map( key => (
									<CompactFormToggle
										checked={ this.state[ `count_roles_${key}` ] }
										disabled={ ! isStatsActive || unavailableInDevMode || this.props.isSavingAnyOption( [ 'stats', 'count_roles' ] ) }
										onChange={ () => this.updateOptions( key, 'count_roles' ) }
										key={ `count_roles-${ key }` }>
											<span className="jp-form-toggle-explanation">
												{ siteRoles[ key ].name }
											</span>
									</CompactFormToggle>
								) )
							}
						</FormFieldset>
						<FormFieldset>
							<FormLegend>{ __( 'Allow stats reports to be viewed by' ) }</FormLegend>
							<CompactFormToggle
								checked={ true }
								disabled={ true }>
									<span className="jp-form-toggle-explanation">
										{ siteRoles.administrator.name }
									</span>
							</CompactFormToggle>
							{
								Object.keys( siteRoles ).map( key => (
									( 'administrator' !== key ) && (
										<CompactFormToggle
											checked={ this.state[ `roles_${key}` ] }
											disabled={ ! isStatsActive || unavailableInDevMode || this.props.isSavingAnyOption( [ 'stats', 'roles' ] ) }
											onChange={ () => this.updateOptions( key, 'roles' ) }
											key={ `roles-${key}` }>
												<span className="jp-form-toggle-explanation">
													{ siteRoles[ key ].name }
												</span>
										</CompactFormToggle>
									)
								) )
							}
						</FormFieldset>
					</SettingsGroup>
				</FoldableCard>
			);
		}
	} )
);
