/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import CompactFormToggle from 'components/form/form-toggle/compact';
import FoldableCard from 'components/foldable-card';
import Button from 'components/button';
import Card from 'components/card';
import { filter, includes } from 'lodash';
import classNames from 'classnames';
import { imagePath } from 'constants/urls';
import analytics from 'lib/analytics';
import getRedirectUrl from 'lib/jp-redirect';

/**
 * Internal dependencies
 */
import { FormFieldset, FormLegend } from 'components/forms';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsGroup from 'components/settings-group';
import SettingsCard from 'components/settings-card';
import ModuleOverriddenBanner from 'components/module-overridden-banner';

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

	handleStatsOptionToggle( option_slug ) {
		return () => this.props.updateFormStateModuleOption( 'stats', option_slug );
	}

	render() {
		const stats = this.props.getModule( 'stats' ),
			isStatsActive = this.props.getOptionValue( 'stats' ),
			unavailableInDevMode = this.props.isUnavailableInDevMode( 'stats' ),
			siteRoles = this.props.getSiteRoles();

		if ( 'inactive' === this.props.getModuleOverride( 'stats' ) ) {
			return <ModuleOverriddenBanner moduleName={ stats.name } />;
		}

		if ( ! isStatsActive ) {
			return (
				<Card
					className={
						'jp-at-a-glance__stats-card ' + ( this.props.isDevMode ? 'is-inactive' : '' )
					}
				>
					<div className="jp-at-a-glance__stats-inactive">
						<div className="jp-at-a-glance__stats-inactive-icon">
							<img
								src={ imagePath + 'stats.svg' }
								width="60"
								height="60"
								alt={ __( 'Jetpack Stats Icon' ) }
								className="jp-at-a-glance__stats-icon"
							/>
						</div>
						<div className="jp-at-a-glance__stats-inactive-text">
							{ this.props.isDevMode
								? __( 'Unavailable in Dev Mode' )
								: __(
										'{{a}}Activate Site Stats{{/a}} to see detailed stats, likes, followers, subscribers, and more! {{a1}}Learn More{{/a1}}',
										{
											components: {
												a: <a href="javascript:void(0)" onClick={ this.activateStats } />,
												a1: (
													<a
														href={ getRedirectUrl( 'jetpack-support-wordpress-com-stats' ) }
														target="_blank"
														rel="noopener noreferrer"
													/>
												),
											},
										}
								  ) }
						</div>
						{ ! this.props.isDevMode && (
							<div className="jp-at-a-glance__stats-inactive-button">
								<Button onClick={ this.activateStats } primary={ true }>
									{ __( 'Activate Site Stats' ) }
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
				header={ __( 'Site stats', { context: 'Settings header' } ) }
				hideButton
				module="site-stats"
			>
				<FoldableCard
					onOpen={ this.trackOpenCard }
					header={ __(
						'Expand to update settings for how visits are counted and manage who can view this information.'
					) }
					clickableHeader={ true }
					className={ classNames( 'jp-foldable-settings-standalone', {
						'jp-foldable-settings-disable': unavailableInDevMode,
					} ) }
				>
					<SettingsGroup
						disableInDevMode
						module={ stats }
						support={ {
							text: __(
								'Displays information on your site activity, including visitors and popular posts or pages.'
							),
							link: getRedirectUrl( 'jetpack-support-wordpress-com-stats' ),
						} }
					>
						<FormFieldset>
							<CompactFormToggle
								checked={ !! this.props.getOptionValue( 'admin_bar' ) }
								disabled={ ! isStatsActive || unavailableInDevMode }
								toggling={ this.props.isSavingAnyOption( [ 'stats', 'admin_bar' ] ) }
								onChange={ this.handleStatsOptionToggle( 'admin_bar' ) }
							>
								<span className="jp-form-toggle-explanation">
									{ __(
										'Include a small chart in your admin bar with a 48-hour traffic snapshot'
									) }
								</span>
							</CompactFormToggle>
							<CompactFormToggle
								checked={ !! this.props.getOptionValue( 'hide_smile' ) }
								disabled={ ! isStatsActive || unavailableInDevMode }
								toggling={ this.props.isSavingAnyOption( [ 'stats', 'hide_smile' ] ) }
								onChange={ this.handleStatsOptionToggle( 'hide_smile' ) }
							>
								<span className="jp-form-toggle-explanation">
									{ __( 'Hide the stats smiley face image' ) }
								</span>
								<span className="jp-form-setting-explanation">
									{ __( 'The image helps collect stats, but should work when hidden.' ) }
								</span>
							</CompactFormToggle>
						</FormFieldset>
						<FormFieldset>
							<FormLegend>{ __( 'Count logged in page views from' ) }</FormLegend>
							{ Object.keys( siteRoles ).map( key => (
								<CompactFormToggle
									checked={ this.state[ `count_roles_${ key }` ] }
									disabled={
										! isStatsActive ||
										unavailableInDevMode ||
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
							<FormLegend>{ __( 'Allow stats reports to be viewed by' ) }</FormLegend>
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
												unavailableInDevMode ||
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
