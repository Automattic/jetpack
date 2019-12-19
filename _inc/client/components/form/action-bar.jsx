/**
 * External Dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';

export default class ActionBar extends React.Component {
	static displayName = 'ActionBar';

	static propTypes = {
		style: PropTypes.object,
	};

	render() {
		return (
			<div className="dops-form-actionbar" style={ this.props.style }>
				{ this.props.children }
			</div>
		);
	}
}
