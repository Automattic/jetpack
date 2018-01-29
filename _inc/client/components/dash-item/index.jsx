/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
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
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import Card from 'components/card';
import SectionHeader from 'components/section-header';
import { ModuleToggle } from 'components/module-toggle';
import { isDevMode } from 'state/connection';
import { getModule as _getModule } from 'state/modules';
import ProStatus from 'pro-status';
import {
	getSiteRawUrl,
	getSiteAdminUrl,
	userCanManageModules
} from 'state/initial-state';

/**
 * Track clicks on monitor settings
 *
 * @returns {undefined}
 */
const trackMonitorSettingsClick = () => analytics.tracks.recordJetpackClick( {
	target: 'monitor-settings',
	page: 'aag'
} );

export class DashItem extends Component {
	static propTypes = {
		label: PropTypes.string,
		status: PropTypes.string,
		statusText: PropTypes.string,
		disabled: PropTypes.bool,
		module: PropTypes.string,
		pro: PropTypes.bool,
		isModule: PropTypes.bool,
	};

	static defaultProps = {
		label: '',
		module: '',
		pro: false,
		isModule: true,
	};

	render() {
		let toggle, proButton = '';

		const classes = classNames(
			this.props.className,
			'jp-dash-item',
			this.props.disabled ? 'jp-dash-item__disabled' : ''
		);

		const toggleModule = () => this.props.updateOptions( { [ this.props.module ]: ! this.props.getOptionValue( this.props.module ) } ),
			trackPaidBtnClick = () => {
				analytics.tracks.recordJetpackClick( {
					target: 'paid-button',
					feature: this.props.module,
					page: 'aag'
				} );
			};

		if ( '' !== this.props.module ) {
			toggle = ( includes( [ 'protect', 'photon', 'vaultpress', 'scan', 'backups', 'akismet' ], this.props.module ) && this.props.isDevMode ) ? '' : (
				<ModuleToggle
					slug={ this.props.module }
					activated={ this.props.getOptionValue( this.props.module ) }
					toggling={ this.props.isUpdating( this.props.module ) }
					toggleModule={ toggleModule }
					compact={ true }
				/>
			);

			if ( 'manage' === this.props.module ) {
				if ( 'is-warning' === this.props.status ) {
					toggle = (
						<a href={ this.props.isDevMode
							? this.props.siteAdminUrl + 'update-core.php'
							: 'https://wordpress.com/plugins/' + this.props.siteRawUrl
						} >
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
				toggle = ! this.props.isDevMode && this.props.getOptionValue( this.props.module ) && (
					<Button
						onClick={ trackMonitorSettingsClick }
						href={ 'https://wordpress.com/settings/security/' + this.props.siteRawUrl }
						compact>
						{
							__( 'Settings' )
						}
					</Button>
				);
			}

			if ( 'rewind' === this.props.module ) {
				toggle = null;
			}
		}

		if ( this.props.pro && ! this.props.isDevMode ) {
			proButton =
				<Button
					onClick={ trackPaidBtnClick }
					compact={ true }
					href="#/plans"
				>
					{ __( 'Paid', { context: 'Short label appearing near a paid feature configuration block.' } ) }
				</Button>
			;

			if ( this.props.isModule ) {
				toggle = <ProStatus proFeature={ this.props.module } siteAdminUrl={ this.props.siteAdminUrl } />;
			}
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
}

export default connect(
	( state ) => {
		return {
			getModule: ( module_name ) => _getModule( state, module_name ),
			isDevMode: isDevMode( state ),
			userCanToggle: userCanManageModules( state ),
			siteRawUrl: getSiteRawUrl( state ),
			siteAdminUrl: getSiteAdminUrl( state )
		};
	}
)( moduleSettingsForm( DashItem ) );
