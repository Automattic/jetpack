/**
 * External dependencies
 */
import React from 'react';
import classNames from 'classnames';
import { connect } from 'react-redux';
import SimpleNotice from 'components/notice';
import { translate as __ } from 'i18n-calypso';
import Button from 'components/button';
import includes from 'lodash/includes';
import analytics from 'lib/analytics';

/**
 * Internal dependencies
 */
import Card from 'components/card';
import SectionHeader from 'components/section-header';
import { ModuleToggle } from 'components/module-toggle';
import { isDevMode } from 'state/connection';
import {
	isModuleActivated as _isModuleActivated,
	activateModule,
	deactivateModule,
	isActivatingModule,
	isDeactivatingModule,
	getModule as _getModule
} from 'state/modules';
import ProStatus from 'pro-status';
import {
	getSiteRawUrl,
	getSiteAdminUrl,
	userCanManageModules
} from 'state/initial-state';

export const DashItem = React.createClass( {
	displayName: 'DashItem',

	propTypes: {
		label: React.PropTypes.string,
		status: React.PropTypes.string,
		statusText: React.PropTypes.string,
		disabled: React.PropTypes.bool,
		module: React.PropTypes.string,
		pro: React.PropTypes.bool
	},

	getDefaultProps() {
		return {
			label: '',
			module: '',
			pro: false
		};
	},

	trackMonitorSettingsClick() {
		analytics.tracks.recordJetpackClick( {
			target: 'monitor-settings',
			page: 'aag'
		} );
	},

	trackPaidBtnClick( feature ) {
		analytics.tracks.recordJetpackClick( {
			target: 'paid-button',
			feature: feature,
			page: 'aag'
		} );
	},

	render() {
		let toggle, proButton = '';

		const classes = classNames(
			this.props.className,
			'jp-dash-item',
			this.props.disabled ? 'jp-dash-item__disabled' : ''
		);

		if ( '' !== this.props.module ) {
			toggle = ( includes( [ 'protect', 'photon', 'vaultpress', 'scan', 'backups', 'akismet' ], this.props.module ) && this.props.isDevMode ) ? '' : (
				<ModuleToggle
					slug={ this.props.module }
					activated={ this.props.isModuleActivated( this.props.module ) }
					toggling={ this.props.isTogglingModule( this.props.module ) }
					toggleModule={ this.props.toggleModule }
					compact={ true }
				/>
			);

			if ( 'manage' === this.props.module ) {
				if ( 'is-warning' === this.props.status ) {
					toggle = (
						<a href={ this.props.isModuleActivated( 'manage' )
							? 'https://wordpress.com/plugins/' + this.props.siteRawUrl
							: this.props.siteAdminUrl + 'plugins.php' } >
							<SimpleNotice
								showDismiss={ false }
								status={ this.props.status }
								isCompact={ true }
							>
								{ __( 'Updates needed', { context: 'Short warning message' } ) }
							</SimpleNotice>
						</a>
					);
				}
				if ( 'is-working' === this.props.status ) {
					toggle = <span className="jp-dash-item__active-label">{ __( 'Active' ) }</span>;
				}
			}

			if ( 'monitor' === this.props.module ) {
				toggle = ! this.props.isDevMode && this.props.isModuleActivated( this.props.module ) && (
					<Button
						onClick={ this.trackMonitorSettingsClick }
						href={ 'https://wordpress.com/settings/security/' + this.props.siteRawUrl }
						compact>
						{
							__( 'Settings' )
						}
					</Button>
				);
			}
		}

		if ( this.props.pro && ! this.props.isDevMode ) {
			proButton =
				<Button
					onClick={ () => this.trackPaidBtnClick( this.props.module ) }
					compact={ true }
					href="#/plans"
				>
					{ __( 'Paid', { context: 'Short label appearing near a paid feature configuration block.' } ) }
				</Button>
			;

			toggle = <ProStatus proFeature={ this.props.module } siteAdminUrl={ this.props.siteAdminUrl } />;
		}

		return (
			<div className={ classes }>
				<SectionHeader
					label={ this.props.label }
					cardBadge={ proButton }
				>
					{ this.props.userCanToggle ? toggle : '' }
				</SectionHeader>
				<Card className="jp-dash-item__card" href={ this.props.href }>
					<div className="jp-dash-item__content">
						{ this.props.children }
					</div>
				</Card>
			</div>
		);
	}
} );

export default connect(
	( state ) => {
		return {
			isModuleActivated: ( module_name ) => _isModuleActivated( state, module_name ),
			isTogglingModule: ( module_name ) => isActivatingModule( state, module_name ) || isDeactivatingModule( state, module_name ),
			getModule: ( module_name ) => _getModule( state, module_name ),
			isDevMode: isDevMode( state ),
			userCanToggle: userCanManageModules( state ),
			siteRawUrl: getSiteRawUrl( state ),
			siteAdminUrl: getSiteAdminUrl( state )
		};
	},
	( dispatch ) => {
		return {
			toggleModule: ( module_name, activated ) => {
				return ( activated )
					? dispatch( deactivateModule( module_name ) )
					: dispatch( activateModule( module_name ) );
			}
		};
	}
)( DashItem );
