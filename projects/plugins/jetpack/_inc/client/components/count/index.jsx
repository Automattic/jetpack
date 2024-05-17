/** @ssr-ready **/

import PropTypes from 'prop-types';
import React from 'react';

import './style.scss';

export default class extends React.PureComponent {
	static displayName = 'Count';

	static propTypes = {
		count: PropTypes.number.isRequired,
	};

	render() {
		return <span className="dops-count">{ this.numberFormat( this.props.count ) }</span>;
	}
}
