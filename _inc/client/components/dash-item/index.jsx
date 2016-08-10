/**
 * External dependencies
 */
import React from 'react';
import classNames from 'classnames';
import { connect } from 'react-redux';
import SimpleNotice from 'components/notice';
import { translate as __ } from 'i18n-calypso';
import Button from 'components/button';

/**
 * Internal dependencies
 */
import Card from 'components/card';
import SectionHeader from 'components/section-header';
import { ModuleToggle } from 'components/module-toggle';
import { isFetchingSiteData } from 'state/site';
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

const DashItem = React.createClass( {
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

	render() {
		let toggle, proButton = '';

		const classes = classNames(
			this.props.className,
			'jp-dash-item',
			this.props.disabled ? 'jp-dash-item__disabled' : ''
		);

		if ( '' !== this.props.module ) {
			toggle = (
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
						<SimpleNotice
							showDismiss={ false }
							status={ this.props.status }
							isCompact={ true }
						>
							{ __( 'Updates Needed' ) }
						</SimpleNotice>
					);
				}
				if ( 'is-working' === this.props.status ) {
					toggle = <span className="jp-dash-item__active-label">{ __( 'Active' ) }</span>
				}
			}
		}

		if ( this.props.pro ) {
			proButton =
				<Button
					compact={ true }
					href="#professional"
				>
					{ __( 'Pro' ) }
				</Button>
			;

			toggle = <ProStatus proFeature={ this.props.module } />;
		}

		return (
			<div className={ classes }>
				<SectionHeader
					label={ this.props.label }
					cardBadge={ proButton }
				>
					{ toggle }
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
			isFetchingSiteData: isFetchingSiteData( state ),
			isDevMode: isDevMode( state )
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
