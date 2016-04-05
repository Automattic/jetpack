/**
 * External dependencies
 */
import React from 'react';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import Card from 'components/card';
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

	render() {
		const classes = classNames(
			this.props.className,
			'jp-dash-item'
		);

		return (

			<div className={ classes }>
				<SectionHeader label={ this.props.label } className={ this.props.status } />
				<Card href={ this.props.href }>
					{ this.props.children }
				</Card>
			</div>
		);
	}
} );
