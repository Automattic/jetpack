/**
 * External Dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';

export default class Section extends React.Component {
	static displayName = 'Section';

	static propTypes = {
		title: PropTypes.any,
		id: PropTypes.string,
	};

	render() {
		return (
			<div id={ this.props.id }>
				{ this.props.title ? (
					<div>
						<div className="dops-form-section-title">{ this.props.title }</div>
						<div className="dops-form-section-body">{ this.props.children }</div>
					</div>
				) : (
					this.props.children
				) }
			</div>
		);
	}
}
