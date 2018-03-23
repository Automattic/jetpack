/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import CompactFormToggle from 'components/form/form-toggle/compact';
import FoldableCard from 'components/foldable-card';
import Button from 'components/button';
import Card from 'components/card';
import includes from 'lodash/includes';
import filter from 'lodash/filter';
import classNames from 'classnames';
import { imagePath } from 'constants/urls';
import analytics from 'lib/analytics';

/**
 * Internal dependencies
 */
import {
	FormFieldset,
	FormLegend
} from 'components/forms';
import { ModuleToggle } from 'components/module-toggle';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import SettingsGroup from 'components/settings-group';
import SettingsCard from 'components/settings-card';

class SiteStatsComponent extends React.Component {
	constructor( props ) {
		super( props );
		const countRoles = props.getOptionValue( 'count_roles', 'stats' ),
			roles = props.getOptionValue( 'roles', 'stats' );

		this.state = {
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
	}

	/**
	 * Update state so toggles are updated.
	 *
	 * @param {string} optionName the slug of the option to update
	 * @param {string} optionSet  the name of a set of options ?
	 */
	updateOptions = ( optionName, optionSet ) => {
		let value = this.props.getOptionValue( optionSet, 'stats' ),
			toggled = false;
		if ( ! this.state[ `${ optionSet }_${ optionName }` ] ) {
			if ( ! includes( value, optionName ) ) {
				value.push( optionName );
				toggled = true;
			}
		} else if ( includes( value, optionName ) ) {
			value = filter( value, item => {
				return item !== optionName;
			} );
		}

		this.setState(
			{
				[ `${ optionSet }_${ optionName }` ]: ! this.state[ `${ optionSet }_${ optionName }` ]
			},
			() => {
				this.props.updateOptions( {
					[ optionSet ]: value
				} );
			}
		);

		analytics.tracks.recordEvent(
			'jetpack_wpa_settings_toggle',
			{
				module: 'stats',
				setting: optionSet,
				role: optionName,
				toggled: toggled ? 'on' : 'off'
			}
		);
	};

	/**
	 * Activate Stats.
	 */
	activateStats = () => {
		this.props.updateOptions( {
			stats: true
		} );
	};

	trackOpenCard = () => {
		analytics.tracks.recordJetpackClick( {
			target: 'foldable-settings-open',
			feature: 'stats'
		} );
	};

	handleRoleToggleChange = ( role, setting ) => {
		return () => this.updateOptions( role, setting );
	}

	handleModuleToggle = ( option_slug ) => {
		return module_slug => this.props.updateFormStateModuleOption( module_slug, option_slug );
	}

	render() {
		const stats = this.props.getModule( 'stats' ),
			isStatsActive = this.props.getOptionValue( 'stats' ),
			unavailableInDevMode = this.props.isUnavailableInDevMode( 'stats' ),
			siteRoles = this.props.getSiteRoles();

		if ( ! isStatsActive ) {
			return (
				<Card className={ 'jp-at-a-glance__stats-card ' + ( this.props.isDevMode ? 'is-inactive' : '' ) }>
					<div className="jp-at-a-glance__stats-inactive">
						<div className="jp-at-a-glance__stats-inactive-icon">
							<img src={ imagePath + 'stats.svg' } width="60" height="60" alt={ __( 'Jetpack Stats Icon' ) } className="jp-at-a-glance__stats-icon" />
						</div>
						<div className="jp-at-a-glance__stats-inactive-text">
							{
								this.props.isDevMode
									? __( 'Unavailable in Dev Mode' )
									: __( '{{a}}Activate Site Stats{{/a}} to see detailed stats, likes, followers, subscribers, and more! {{a1}}Learn More{{/a1}}', {
										components: {
											a: <a href="javascript:void(0)" onClick={ this.activateStats } />,
											a1: <a href="https://jetpack.com/support/wordpress-com-stats/" target="_blank" rel="noopener noreferrer" />
										}
									} )
							}
						</div>
						{
							! this.props.isDevMode && (
								<div className="jp-at-a-glance__stats-inactive-button">
									<Button
										onClick={ this.activateStats }
										primary={ true }
									>
										{ __( 'Activate Site Stats' ) }
									</Button>
								</div>
							)
						}
					</div>
				</Card>
			);
		}

		return (
			<SettingsCard
				{ ...this.props }
				header={ __( 'Site stats', { context: 'Settings header' } ) }
				hideButton
			>
				<FoldableCard
					onOpen={ this.trackOpenCard }
					header={ __( 'Collecting valuable traffic stats and insights' ) }
					clickableHeader={ true }
					className={ classNames( 'jp-foldable-settings-standalone', { 'jp-foldable-settings-disable': unavailableInDevMode } ) }
				>
					<SettingsGroup
						disableInDevMode
						module={ stats }
						support={ {
							text: __( 'Displays information on your site activity, including visitors and popular posts or pages.' ),
							link: 'https://jetpack.com/support/wordpress-com-stats/',
						} }
						>
						<FormFieldset>
							<ModuleToggle
								slug="stats"
								compact
								disabled={ ! isStatsActive || unavailableInDevMode }
								activated={ !! this.props.getOptionValue( 'admin_bar' ) }
								toggling={ this.props.isSavingAnyOption( [ 'stats', 'admin_bar' ] ) }
								toggleModule={ this.handleModuleToggle( 'admin_bar' ) }
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
								toggleModule={ this.handleModuleToggle( 'hide_smile' ) }
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
										checked={ this.state[ `count_roles_${ key }` ] }
										disabled={ ! isStatsActive || unavailableInDevMode || this.props.isSavingAnyOption( [ 'stats', 'count_roles' ] ) }
										onChange={ this.handleRoleToggleChange( key, 'count_roles' ) }
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
											checked={ this.state[ `roles_${ key }` ] }
											disabled={ ! isStatsActive || unavailableInDevMode || this.props.isSavingAnyOption( [ 'stats', 'roles' ] ) }
											onChange={ this.handleRoleToggleChange( key, 'roles' ) }
											key={ `roles-${ key }` }>
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
			</SettingsCard>
		);
	}
}

export const SiteStats = moduleSettingsForm( SiteStatsComponent );
