/**
 * External dependencies
 */
import React from 'react';
import { noop } from 'lodash';
import classnames from 'classnames';

class MenuItem extends React.Component {
	static defaultProps = {
		isVisible: false,
		className: '',
		focusOnHover: true,
	};

	render() {
		const onMouseOver = this.props.focusOnHover ? this._onMouseOver : null;
		return (
			<button
				className={ classnames( 'dops-popover__menu-item', this.props.className ) }
				role="menuitem"
				disabled={ this.props.disabled }
				onClick={ this.props.onClick }
				onMouseOver={ onMouseOver }
				onFocus={ noop }
				tabIndex="-1"
			>
				{ this.props.children }
			</button>
		);
	}

	_onMouseOver = event => {
		event.target.focus();
	};
}

export default MenuItem;
