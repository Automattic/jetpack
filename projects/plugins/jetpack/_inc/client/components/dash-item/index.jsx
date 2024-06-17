import { getRedirectUrl } from '@automattic/jetpack-components';
import { __, _x } from '@wordpress/i18n';
import clsx from 'clsx';
import Button from 'components/button';
import Card from 'components/card';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SimpleNotice from 'components/notice';
import SectionHeader from 'components/section-header';
import SupportInfo from 'components/support-info';
import analytics from 'lib/analytics';
import { includes } from 'lodash';
import ProStatus from 'pro-status';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { isOfflineMode } from 'state/connection';
import { getSiteRawUrl, getSiteAdminUrl, userCanManageModules } from 'state/initial-state';
import { getModule as _getModule } from 'state/modules';

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
		overrideContent: PropTypes.element,
		noToggle: PropTypes.bool,
	};

	static defaultProps = {
		label: '',
		module: '',
		pro: false,
		isModule: true,
		support: { text: '', link: '' },
		noToggle: false,
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

		const classes = clsx(
			this.props.className,
			'jp-dash-item',
			this.props.disabled ? 'jp-dash-item__disabled' : ''
		);

		if ( '' !== this.props.module ) {
			toggle =
				( includes(
					[
						'monitor',
						'protect',
						'photon',
						'vaultpress',
						'scan',
						'backups',
						'akismet',
						'search',
						'videopress',
					],
					this.props.module
				) &&
					this.props.isOfflineMode ) ||
				this.props.noToggle ||
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
								this.props.isOfflineMode
									? this.props.siteAdminUrl + 'update-core.php'
									: getRedirectUrl( 'calypso-plugins-manage', { site: this.props.siteRawUrl } )
							}
						>
							<SimpleNotice showDismiss={ false } status={ this.props.status } isCompact={ true }>
								{ _x( 'Updates needed', 'Short warning message', 'jetpack' ) }
							</SimpleNotice>
						</a>
					);
				}
				if ( 'is-working' === this.props.status ) {
					toggle = (
						<span className="jp-dash-item__active-label">{ __( 'Active', 'jetpack' ) }</span>
					);
				}
			}

			if ( 'rewind' === this.props.module ) {
				toggle = null;
			}
		}

		if ( this.props.pro && ! this.props.isOfflineMode ) {
			proButton = (
				<Button onClick={ this.trackPaidBtnClick } compact={ true } href="#/plans">
					{ _x(
						'Paid',
						'Short label appearing near a paid feature configuration block.',
						'jetpack'
					) }
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
				{ this.props.overrideContent ? (
					this.props.overrideContent
				) : (
					<Card className="jp-dash-item__card" href={ this.props.href }>
						<div className="jp-dash-item__content">
							{ this.props.support.text && (
								<SupportInfo module={ module } { ...this.props.support } />
							) }
							{ this.props.children }
						</div>
					</Card>
				) }
			</div>
		);
	}
}

export default connect( state => {
	return {
		getModule: module_name => _getModule( state, module_name ),
		isOfflineMode: isOfflineMode( state ),
		userCanToggle: userCanManageModules( state ),
		siteRawUrl: getSiteRawUrl( state ),
		siteAdminUrl: getSiteAdminUrl( state ),
	};
} )( withModuleSettingsFormHelpers( DashItem ) );
