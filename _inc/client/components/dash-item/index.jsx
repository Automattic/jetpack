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
import Gridicon from 'components/gridicon';
import SectionHeader from 'components/section-header';
import { ModuleToggle } from 'components/module-toggle';
import {
	isModuleActivated as _isModuleActivated,
	activateModule,
	deactivateModule,
	isActivatingModule,
	isDeactivatingModule,
	getModule as _getModule
} from 'state/modules';

const DashItem = React.createClass( {
	displayName: 'DashItem',

	propTypes: {
		label: React.PropTypes.string,
		status: React.PropTypes.string,
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

	getIcon() {
		let icon;

		switch ( this.props.status ) {
			case 'is-info':
				icon = 'info';
				break;
			case 'is-success':
				icon = 'checkmark';
				break;
			case 'is-error':
				icon = 'notice';
				break;
			case 'is-warning':
				icon = 'notice';
				break;
			case 'is-working':
				icon = 'checkmark';
				break;
			case 'is-premium-inactive':
				icon = 'lock';
				break;
			default:
				icon = 'info';
				break;
		}

		return icon;
	},

	render() {
		let icon, toggle, proButton = '';

		const classes = classNames(
			this.props.className,
			'jp-dash-item',
			this.props.disabled ? 'jp-dash-item__disabled' : ''
		);

		if ( this.props.status ) {
			icon = (
				<Gridicon icon={ this.props.icon || this.getIcon() } size={ 24 } />
			);
		}

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

			if ( 'manage' === this.props.module && 'is-warning' === this.props.status ) {
				let text = __( 'Updates Needed' );
				toggle = (
					<SimpleNotice
						showDismiss={ false }
						status={ this.props.status }
					    isCompact={ true }
					>
						{ text }
					</SimpleNotice>
				);
			}
		}

		if ( this.props.pro ) {
			proButton =
				<Button compact={ true }>Pro</Button>
			;
		}

		return (

			<div className={ classes }>
				<SectionHeader
					label={ this.props.label }
					cardBadge={ proButton }
				>
					{ toggle }
				</SectionHeader>
				<Card href={ this.props.href }>
					{ this.props.children }
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
			getModule: ( module_name ) => _getModule( state, module_name )
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
