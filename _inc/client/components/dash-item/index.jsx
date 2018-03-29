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

	trackPaidBtnClick = () => analytics.tracks.recordJetpackClick( {
		target: 'paid-button',
		feature: this.props.module,
		page: 'aag'
	} );

	getProButton = () => ( this.props.pro && ! this.props.isDevMode && this.props.isModule )
		? (
			<Button
				onClick={ this.trackPaidBtnClick }
				compact={ true }
				href="#/plans"
				>
				{ __( 'Paid', { context: 'Short label appearing near a paid feature configuration block.' } ) }
			</Button>
		)
		: '';

	toggleModule = () => this.props.updateOptions( { [ this.props.module ]: ! this.props.getOptionValue( this.props.module ) } );

	getToggle = () => {
		if ( 'manage' === this.props.module ) {
			switch ( this.props.status ) {
				case 'is-warning':
					return (
						<a
							href={ this.props.isDevMode
								? this.props.siteAdminUrl + 'update-core.php'
								: 'https://wordpress.com/plugins/manage/' + this.props.siteRawUrl
							}
							>
							<SimpleNotice
								showDismiss={ false }
								status={ this.props.status }
								isCompact={ true }
								>
								{ __( 'Updates needed', { context: 'Short warning message' } ) }
							</SimpleNotice>
						</a>
					);
				case 'is-working':
					return <span className="jp-dash-item__active-label">{ __( 'Active' ) }</span>;
			}
		}

		if ( this.props.isDevMode || '' === this.props.module ) {
			return '';
		}

		switch ( this.props.module ) {
			case 'protect':
			case 'photon':
			case 'search':
				return (
					<ModuleToggle
						slug={ this.props.module }
						activated={ this.props.getOptionValue( this.props.module ) }
						toggling={ this.props.isUpdating( this.props.module ) }
						toggleModule={ this.toggleModule }
						compact={ true }
					/>
				);

			case 'monitor':
				return this.props.getOptionValue( this.props.module ) && (
					<Button
						compact
						onClick={ trackMonitorSettingsClick }
						href={ `https://wordpress.com/settings/security/${ this.props.siteRawUrl }` }
						>
						{ __( 'Settings' ) }
					</Button>
				);

			case 'rewind':
				if ( 'is-awaiting-credentials' === this.props.status ) {
					return (
						<SimpleNotice isCompact showDismiss={ false } status="is-warning">
							{ __( 'Action needed', { context: 'Short warning message' } ) }
						</SimpleNotice>
					);
				}
				return <ProStatus proFeature={ this.props.module } siteAdminUrl={ this.props.siteAdminUrl } />;

			default:
				return this.props.pro && <ProStatus proFeature={ this.props.module } siteAdminUrl={ this.props.siteAdminUrl } />;
		}
	};

	render() {
		return (
			<div className={ classNames(
				this.props.className,
				'jp-dash-item',
				{ 'jp-dash-item__disabled': this.props.disabled },
			) }>
				<SectionHeader
					label={ this.props.label }
					cardBadge={ this.getProButton() }
					>
					{ this.props.userCanToggle && this.getToggle() }
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
