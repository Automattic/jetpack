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
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import Card from 'components/card';
import SectionHeader from 'components/section-header';
import SupportInfo from 'components/support-info';
import { ModuleToggle } from 'components/module-toggle';
import { isDevMode } from 'state/connection';
import { getModule as _getModule } from 'state/modules';
import ProStatus from 'pro-status';
import { getSiteRawUrl, getSiteAdminUrl, userCanManageModules } from 'state/initial-state';

export class DashItem extends Component {
	static propTypes = {
		label: PropTypes.string,
		status: PropTypes.string,
		statusText: PropTypes.string,
		disabled: PropTypes.bool,
		module: PropTypes.string,
		pro: PropTypes.bool,
		isModule: PropTypes.bool,
		support: PropTypes.object,
	};

	static defaultProps = {
		label: '',
		module: '',
		pro: false,
		isModule: true,
		support: { text: '', link: '' },
	};

	toggleModule = () => {
		const { updateOptions, module, getOptionValue } = this.props;

		updateOptions( { [ module ]: ! getOptionValue( module ) } );
	};

	trackPaidBtnClick = () => {
		analytics.tracks.recordJetpackClick( {
			target: 'paid-button',
			feature: this.props.module,
			page: 'aag',
		} );
	};

	render() {
		let module,
			toggle,
			proButton = '';

		const classes = classNames(
			this.props.className,
			'jp-dash-item',
			this.props.disabled ? 'jp-dash-item__disabled' : ''
		);

		if ( '' !== this.props.module ) {
			toggle =
				( includes(
					[ 'monitor', 'protect', 'photon', 'vaultpress', 'scan', 'backups', 'akismet', 'search' ],
					this.props.module
				) &&
					this.props.isDevMode ) ||
				// Avoid toggle for manage as it's no longer a module
				'manage' === this.props.module ? (
					''
				) : (
					<ModuleToggle
						slug={ this.props.module }
						activated={ this.props.getOptionValue( this.props.module ) }
						toggling={ this.props.isUpdating( this.props.module ) }
						toggleModule={ this.toggleModule }
						compact={ true }
					/>
				);

			if ( 'manage' === this.props.module ) {
				if ( 'is-warning' === this.props.status ) {
					toggle = (
						<a
							href={
								this.props.isDevMode
									? this.props.siteAdminUrl + 'update-core.php'
									: 'https://wordpress.com/plugins/manage/' + this.props.siteRawUrl
							}
						>
							<SimpleNotice showDismiss={ false } status={ this.props.status } isCompact={ true }>
								{ __( 'Updates needed', { context: 'Short warning message' } ) }
							</SimpleNotice>
						</a>
					);
				}
				if ( 'is-working' === this.props.status ) {
					toggle = <span className="jp-dash-item__active-label">{ __( 'Active' ) }</span>;
				}
			}

			if ( 'rewind' === this.props.module ) {
				toggle = null;
			}
		}

		if ( this.props.pro && ! this.props.isDevMode ) {
			proButton = (
				<Button onClick={ this.trackPaidBtnClick } compact={ true } href="#/plans">
					{ __( 'Paid', {
						context: 'Short label appearing near a paid feature configuration block.',
					} ) }
				</Button>
			);

			if ( this.props.isModule ) {
				toggle = (
					<ProStatus proFeature={ this.props.module } siteAdminUrl={ this.props.siteAdminUrl } />
				);
			}
		}

		if ( this.props.module && this.props.getModule ) {
			module = this.props.getModule( this.props.module );
		}

		return (
			<div className={ classes }>
				<SectionHeader label={ this.props.label } cardBadge={ proButton }>
					{ this.props.userCanToggle ? toggle : '' }
				</SectionHeader>
				<Card className="jp-dash-item__card" href={ this.props.href }>
					<div className="jp-dash-item__content">
						{ this.props.support.link && (
							<SupportInfo module={ module } { ...this.props.support } />
						) }
						{ this.props.children }
					</div>
				</Card>
			</div>
		);
	}
}

export default connect( state => {
	return {
		getModule: module_name => _getModule( state, module_name ),
		isDevMode: isDevMode( state ),
		userCanToggle: userCanManageModules( state ),
		siteRawUrl: getSiteRawUrl( state ),
		siteAdminUrl: getSiteAdminUrl( state ),
	};
} )( withModuleSettingsFormHelpers( DashItem ) );
