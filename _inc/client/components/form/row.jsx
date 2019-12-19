/**
 * External Dependencies
 */
import React from 'react';

export default class Row extends React.Component {
	static displayName = 'Row';

	render() {
		return <div className="dops-form-row">{ this.props.children }</div>;
	}
}
