import clsx from 'clsx';
import { noop } from 'lodash';
import React from 'react';

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
				className={ clsx( 'dops-popover__menu-item', this.props.className ) }
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
