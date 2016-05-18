/**
 * External dependencies
 */
import React from 'react';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import Card from 'components/card';
import Gridicon from 'components/gridicon';
import SectionHeader from 'components/section-header';

export default React.createClass( {
	displayName: 'DashItem',

	propTypes: {
		label: React.PropTypes.string,
		status: React.PropTypes.string
	},

	getDefaultProps() {
		return {
			label: '',
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
		let icon;

		const classes = classNames(
			this.props.className,
			'jp-dash-item'
		);

		if ( this.props.status ) {
			icon = (
				<Gridicon icon={ this.props.icon || this.getIcon() } size={ 24 } />
			);
		}

		return (

			<div className={ classes }>
				<SectionHeader
					label={ this.props.label }
					className={ this.props.status }>
					{ icon }
				</SectionHeader>
				<Card href={ this.props.href }>
					{ this.props.children }
				</Card>
			</div>
		);
	}
} );
