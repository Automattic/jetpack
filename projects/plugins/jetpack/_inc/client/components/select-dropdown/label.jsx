/** @ssr-ready **/
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/label-has-for */

import React from 'react';

/**
 * Module variables
 */
const { Component } = React;
const stopPropagation = event => event.stopPropagation();

class SelectDropdownLabel extends Component {
	render() {
		return (
			<li role="menuitem" onClick={ stopPropagation } className="dops-select-dropdown__label">
				<label>{ this.props.children }</label>
			</li>
		);
	}
}

export default SelectDropdownLabel;
