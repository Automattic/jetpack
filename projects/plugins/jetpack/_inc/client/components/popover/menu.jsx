import PropTypes from 'prop-types';

import ReactDom from 'react-dom';
import React from 'react';
import Popover from 'components/popover';

class PopoverMenu extends React.Component {
	static propTypes = {
		isVisible: PropTypes.bool.isRequired,
		onClose: PropTypes.func.isRequired,
		position: PropTypes.string,
		className: PropTypes.string,
	};

	static defaultProps = {
		position: 'top',
	};

	componentWillUnmount() {
		// Make sure we don't hold on to reference to the DOM reference
		this._previouslyFocusedElement = null;
	}

	render() {
		const children = React.Children.map( this.props.children, this._setPropsOnChild, this );

		return (
			<Popover
				isVisible={ this.props.isVisible }
				context={ this.props.context }
				position={ this.props.position }
				onClose={ this._onClose }
				onShow={ this._onShow }
				className={ this.props.className }
			>
				<div
					ref="menu"
					role="menu"
					className="dops-popover__menu"
					onKeyDown={ this._onKeyDown }
					tabIndex="-1"
				>
					{ children }
				</div>
			</Popover>
		);
	}

	_setPropsOnChild = child => {
		if ( child == null ) {
			return child;
		}

		const boundOnClose = this._onClose.bind( this, child.props.action );
		let onClick = boundOnClose;

		if ( child.props.onClick ) {
			onClick = child.props.onClick.bind( null, boundOnClose );
		}

		return React.cloneElement( child, {
			onClick: onClick,
		} );
	};

	_onShow = () => {
		const elementToFocus = ReactDom.findDOMNode( this.refs.menu );

		this._previouslyFocusedElement = document.activeElement;

		if ( elementToFocus ) {
			elementToFocus.focus();
		}
	};

	_isInvalidTarget = target => {
		return target.tagName === 'HR';
	};

	/*
	 * Warning:
	 *
	 * This doesn't cover crazy things like a separator at the very top or
	 * bottom.
	 */
	_getClosestSibling = ( target, isDownwardMotion = true ) => {
		const menu = ReactDom.findDOMNode( this.refs.menu );

		let first = menu.firstChild,
			last = menu.lastChild;

		if ( ! isDownwardMotion ) {
			first = menu.lastChild;
			last = menu.firstChild;
		}

		if ( target === menu ) {
			return first;
		}

		const closest = target[ isDownwardMotion ? 'nextSibling' : 'previousSibling' ];

		const sibling = closest || last;

		return this._isInvalidTarget( sibling )
			? this._getClosestSibling( sibling, isDownwardMotion )
			: sibling;
	};

	_onKeyDown = event => {
		const target = event.target;
		let handled = false,
			elementToFocus;

		switch ( event.keyCode ) {
			case 9: // tab
				this.props.onClose();
				handled = true;
				break;
			case 38: // up arrow
				elementToFocus = this._getClosestSibling( target, false );
				handled = true;
				break;
			case 40: // down arrow
				elementToFocus = this._getClosestSibling( target, true );
				handled = true;
				break;
			default:
				break; // do nothing
		}

		if ( elementToFocus ) {
			elementToFocus.focus();
		}

		if ( handled ) {
			event.preventDefault();
		}
	};

	_onClose = action => {
		if ( this._previouslyFocusedElement ) {
			this._previouslyFocusedElement.focus();
			this._previouslyFocusedElement = null;
		}

		if ( this.props.onClose ) {
			this.props.onClose( action );
		}
	};
}

export default PopoverMenu;
