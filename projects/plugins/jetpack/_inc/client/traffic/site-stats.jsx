import { imagePath } from 'constants/urls';
import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import classNames from 'classnames';
import Button from 'components/button';
import Card from 'components/card';
import FoldableCard from 'components/foldable-card';
import CompactFormToggle from 'components/form/form-toggle/compact';
import { FormFieldset, FormLegend } from 'components/forms';
import ModuleOverriddenBanner from 'components/module-overridden-banner';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import analytics from 'lib/analytics';
import { filter, includes } from 'lodash';
import React from 'react';

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
			roles_subscriber: includes( roles, 'subscriber', false ),
		};

		if ( roles ) {
			this.addCustomCountRolesState( countRoles );
			this.addCustomRolesState( roles );
		}
	}

	/**
	 * Update state so toggles are updated.
	 *
	 * @param {string} optionName - the slug of the option to update
	 * @param {string} optionSet  - the name of a set of options ?
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
				[ `${ optionSet }_${ optionName }` ]: ! this.state[ `${ optionSet }_${ optionName }` ],
			},
			() => {
				this.props.updateOptions( {
					[ optionSet ]: value,
				} );
			}
		);

		analytics.tracks.recordEvent( 'jetpack_wpa_settings_toggle', {
			module: 'stats',
			setting: optionSet,
			role: optionName,
			toggled: toggled ? 'on' : 'off',
		} );
	};

	/**
	 * Activate Stats.
	 */
	activateStats = () => {
		this.props.updateOptions( {
			stats: true,
		} );
	};

	trackOpenCard = () => {
		analytics.tracks.recordJetpackClick( {
			target: 'foldable-settings-open',
			feature: 'stats',
		} );
	};

	handleRoleToggleChange = ( role, setting ) => {
		return () => this.updateOptions( role, setting );
	};

	/**
	 * Allows for custom roles 'count logged in page views' stats settings to be added to the current state.
	 *
	 * @param {Array} countRoles - All roles (including custom) that have 'count logged in page views' enabled.
	 */
	addCustomCountRolesState( countRoles ) {
		countRoles.forEach( role => {
			if (
				! [ 'administrator', 'editor', 'author', 'subscriber', 'contributor' ].includes(
					countRoles
				)
			) {
				this.state[ `count_roles_${ role }` ] = includes( countRoles, role, false );
			}
		} );
	}

	/**
	 * Allows for custom roles 'allow stats reports' stats settings to be added to the current state.
	 *
	 * @param {Array} roles - All roles (including custom) that have 'allow stats reports' enabled.
	 */
	addCustomRolesState( roles ) {
		roles.forEach( role => {
			if (
				! [ 'administrator', 'editor', 'author', 'subscriber', 'contributor' ].includes( role )
			) {
				this.state[ `roles_${ role }` ] = includes( roles, role, false );
			}
		} );
	}

	handleStatsOptionToggle( option_slug ) {
		return () => this.props.updateFormStateModuleOption( 'stats', option_slug );
	}

	render() {
		const stats = this.props.getModule( 'stats' ),
			isStatsActive = this.props.getOptionValue( 'stats' ),
			unavailableInOfflineMode = this.props.isUnavailableInOfflineMode( 'stats' ),
			siteRoles = this.props.getSiteRoles();

		if ( 'inactive' === this.props.getModuleOverride( 'stats' ) ) {
			return <ModuleOverriddenBanner moduleName={ stats.name } />;
		}

		if ( ! isStatsActive ) {
			return (
				<Card
					className={
						'jp-at-a-glance__stats-card ' + ( this.props.isOfflineMode ? 'is-inactive' : '' )
					}
				>
					<div className="jp-at-a-glance__stats-inactive">
						<div className="jp-at-a-glance__stats-inactive-icon">
							<img
								src={ imagePath + 'stats.svg' }
								width="60"
								height="60"
								alt={ __( 'Jetpack Stats Icon', 'jetpack' ) }
								className="jp-at-a-glance__stats-icon"
							/>
						</div>
						<div className="jp-at-a-glance__stats-inactive-text">
							{ this.props.isOfflineMode
								? __( 'Unavailable in Offline Mode', 'jetpack' )
								: createInterpolateElement(
										__(
											'<a>Activate Site Stats</a> to see detailed stats, likes, followers, subscribers, and more! <a1>Learn More</a1>',
											'jetpack'
										),
										{
											a: <a href="javascript:void(0)" onClick={ this.activateStats } />,
											a1: (
												<a
													href={ getRedirectUrl( 'jetpack-support-wordpress-com-stats' ) }
													target="_blank"
													rel="noopener noreferrer"
												/>
											),
										}
								  ) }
						</div>
						{ ! this.props.isOfflineMode && (
							<div className="jp-at-a-glance__stats-inactive-button">
								<Button onClick={ this.activateStats } primary={ true }>
									{ __( 'Activate Site Stats', 'jetpack' ) }
								</Button>
							</div>
						) }
					</div>
				</Card>
			);
		}

		return (
			<SettingsCard
				{ ...this.props }
				header={ _x( 'Site stats', 'Settings header', 'jetpack' ) }
				hideButton
				module="site-stats"
			>
				<FoldableCard
					onOpen={ this.trackOpenCard }
					header={ __(
						'Expand to update settings for how visits are counted and manage who can view this information.',
						'jetpack'
					) }
					clickableHeader={ true }
					className={ classNames( 'jp-foldable-settings-standalone', {
						'jp-foldable-settings-disable': unavailableInOfflineMode,
					} ) }
				>
					<SettingsGroup
						disableInOfflineMode
						module={ stats }
						support={ {
							text: __(
								'Displays information on your site activity, including visitors and popular posts or pages.',
								'jetpack'
							),
							link: getRedirectUrl( 'jetpack-support-wordpress-com-stats' ),
						} }
					>
						<FormFieldset>
							<CompactFormToggle
								checked={ !! this.props.getOptionValue( 'admin_bar' ) }
								disabled={ ! isStatsActive || unavailableInOfflineMode }
								toggling={ this.props.isSavingAnyOption( [ 'stats', 'admin_bar' ] ) }
								onChange={ this.handleStatsOptionToggle( 'admin_bar' ) }
							>
								<span className="jp-form-toggle-explanation">
									{ __(
										'Include a small chart in your admin bar with a 48-hour traffic snapshot',
										'jetpack'
									) }
								</span>
							</CompactFormToggle>
						</FormFieldset>
						<FormFieldset>
							<FormLegend>{ __( 'Count logged in page views from', 'jetpack' ) }</FormLegend>
							{ Object.keys( siteRoles ).map( key => (
								<CompactFormToggle
									checked={ this.state[ `count_roles_${ key }` ] }
									disabled={
										! isStatsActive ||
										unavailableInOfflineMode ||
										this.props.isSavingAnyOption( [ 'stats', 'count_roles' ] )
									}
									onChange={ this.handleRoleToggleChange( key, 'count_roles' ) }
									key={ `count_roles-${ key }` }
								>
									<span className="jp-form-toggle-explanation">{ siteRoles[ key ].name }</span>
								</CompactFormToggle>
							) ) }
						</FormFieldset>
						<FormFieldset>
							<FormLegend>{ __( 'Allow stats reports to be viewed by', 'jetpack' ) }</FormLegend>
							<CompactFormToggle checked={ true } disabled={ true }>
								<span className="jp-form-toggle-explanation">{ siteRoles.administrator.name }</span>
							</CompactFormToggle>
							{ Object.keys( siteRoles ).map(
								key =>
									'administrator' !== key && (
										<CompactFormToggle
											checked={ this.state[ `roles_${ key }` ] }
											disabled={
												! isStatsActive ||
												unavailableInOfflineMode ||
												this.props.isSavingAnyOption( [ 'stats', 'roles' ] )
											}
											onChange={ this.handleRoleToggleChange( key, 'roles' ) }
											key={ `roles-${ key }` }
										>
											<span className="jp-form-toggle-explanation">{ siteRoles[ key ].name }</span>
										</CompactFormToggle>
									)
							) }
						</FormFieldset>
					</SettingsGroup>
				</FoldableCard>
			</SettingsCard>
		);
	}
}

export const SiteStats = withModuleSettingsFormHelpers( SiteStatsComponent );
