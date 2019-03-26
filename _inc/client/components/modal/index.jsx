/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/onclick-has-role */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */

/**
 * External Dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import assign from 'lodash/assign';
import omit from 'lodash/omit';
import focusTrap from 'focus-trap';

// this flag will prevent ANY modals from closing.
// use with caution!
// e.g. Modal.preventClose();
//      Modal.allowClose();
// this is for important processes that must not be interrupted, e.g. payments
let preventCloseFlag = false;

import './style.scss';

function preventClose() {
	preventCloseFlag = true;
}

function allowClose() {
	preventCloseFlag = false;
}

class Modal extends React.Component {
	static propTypes = {
		style: PropTypes.object,
		width: PropTypes.oneOf( [ 'wide', 'medium', 'narrow' ] ),
		className: PropTypes.string,
		title: PropTypes.string,
		initialFocus: PropTypes.string,
		onRequestClose: PropTypes.func,
	};

	static defaultProps = {
		style: {},
	};

	state = {
		overlayMouseDown: false,
	};

	componentDidMount() {
		jQuery( 'body' )
			.addClass( 'dops-modal-showing' )
			.on( 'touchmove.dopsmodal', false );
		jQuery( document ).keyup( this.handleEscapeKey );
		try {
			focusTrap.activate( ReactDOM.findDOMNode( this ), {
				// onDeactivate: this.maybeClose,
				initialFocus: this.props.initialFocus,
			} );
		} catch ( e ) {
			//noop
		}
	}

	componentWillUnmount() {
		jQuery( 'body' )
			.removeClass( 'dops-modal-showing' )
			.off( 'touchmove.dopsmodal', false );
		jQuery( document ).unbind( 'keyup', this.handleEscapeKey );
		try {
			focusTrap.deactivate();
		} catch ( e ) {
			//noop
		}
	}

	handleEscapeKey = e => {
		if ( e.keyCode === 27 ) {
			// escape key maps to keycode `27`
			this.maybeClose();
		}
	};

	maybeClose = () => {
		if ( this.props.onRequestClose && ! preventCloseFlag ) {
			this.props.onRequestClose();
		}
	};

	// this exists so we can differentiate between click events on the background
	// which initiated there vs. drags that ended there (most notably from the slider in a modal)
	handleMouseDownOverlay = e => {
		e.preventDefault();
		e.stopPropagation();
		this.setState( { overlayMouseDown: true } );
	};

	handleClickOverlay = e => {
		e.preventDefault();
		e.stopPropagation();
		if ( this.state.overlayMouseDown && this.props.onRequestClose && ! preventCloseFlag ) {
			this.setState( { overlayMouseDown: false } );
			this.props.onRequestClose();
		}
	};

	// prevent clicks from propagating to background
	handleMouseEventModal = e => {
		e.stopPropagation();
	};

	render() {
		let containerStyle;

		const { style, className, width, title, ...other } = this.props;
		const { forwardedProps } = omit( other, 'onRequestClose' );
		switch ( width ) {
			case 'wide':
				containerStyle = { maxWidth: 'inherit', width: 'inherit' };
				break;
			case 'medium':
				containerStyle = { maxWidth: 1050, width: 'inherit' };
				break;
			default:
				containerStyle = {};
		}

		const combinedStyle = assign( {}, style, containerStyle );
		return (
			<div
				className="dops-modal-wrapper"
				onClick={ this.handleClickOverlay }
				onMouseDown={ this.handleMouseDownOverlay }
			>
				<div
					className={ classNames( 'dops-modal', className ) }
					style={ combinedStyle }
					onClick={ this.handleMouseEventModal }
					onMouseDown={ this.handleMouseEventModal }
					onMouseUp={ this.handleMouseEventModal }
					role="dialog"
					aria-label={ title }
					{ ...forwardedProps }
				>
					{ this.props.children }
				</div>
			</div>
		);
	}
}

Modal.preventClose = preventClose;
Modal.allowClose = allowClose;

module.exports = Modal;
