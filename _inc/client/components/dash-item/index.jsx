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
		label: React.PropTypes.string
	},

	getDefaultProps() {
		return {
			label: '',
			href: null
		};
	},

	render() {
		const classes = classNames(
			this.props.className,
			'jp-dash-item'
		);

		return (
			<div className={ classes }>
				<SectionHeader label={ this.props.label } />
				<Card href={ this.props.href }>
					{ this.props.children }
				</Card>
			</div>
		);
	}
} );
