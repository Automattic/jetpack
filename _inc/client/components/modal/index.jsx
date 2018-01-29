/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/onclick-has-role */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */

var React = require( 'react' ),
	ReactDOM = require( 'react-dom' ),
	classNames = require( 'classnames' ),
	assign = require( 'lodash/assign' );

var focusTrap = require( 'focus-trap' );

// this flag will prevent ANY modals from closing.
// use with caution!
// e.g. Modal.preventClose();
//      Modal.allowClose();
// this is for important processes that must not be interrupted, e.g. payments
var preventCloseFlag = false;

require( './style.scss' );

function preventClose() {
	preventCloseFlag = true;
}

function allowClose() {
	preventCloseFlag = false;
}

let Modal = React.createClass( {

	propTypes: {
		style: React.PropTypes.object,
		width: React.PropTypes.oneOf( ['wide', 'medium', 'narrow'] ),
		className: React.PropTypes.string,
		title: React.PropTypes.string,
		initialFocus: React.PropTypes.string,
		onRequestClose: React.PropTypes.func
	},

	getInitialState: function() {
		return {
			overlayMouseDown: false
		};
	},

	getDefaultProps: function() {
		return {
			style: {}
		};
	},

	componentDidMount: function() {
		jQuery( 'body' ).addClass( 'dops-modal-showing' ).on( 'touchmove.dopsmodal', false );
		jQuery( document ).keyup( this.handleEscapeKey );
		try {
			focusTrap.activate( ReactDOM.findDOMNode( this ), {
				// onDeactivate: this.maybeClose,
				initialFocus: this.props.initialFocus
			} );
		} catch ( e ) {
			//noop
		}
	},

	componentWillUnmount: function() {
		jQuery( 'body' ).removeClass( 'dops-modal-showing' ).off( 'touchmove.dopsmodal', false );
		jQuery( document ).unbind( 'keyup', this.handleEscapeKey );
		try {
			focusTrap.deactivate();
		} catch ( e ) {
			//noop
		}
	},

	handleEscapeKey: function( e ) {
		if ( e.keyCode === 27 ) { // escape key maps to keycode `27`
			this.maybeClose();
		}
	},

	maybeClose: function() {
		if ( this.props.onRequestClose && !preventCloseFlag ) {
			this.props.onRequestClose();
		}
	},

	// this exists so we can differentiate between click events on the background
	// which initiated there vs. drags that ended there (most notably from the slider in a modal)
	handleMouseDownOverlay: function( e ) {
		e.preventDefault();
		e.stopPropagation();
		this.setState( { overlayMouseDown: true } );
	},

	handleClickOverlay: function( e ) {
		e.preventDefault();
		e.stopPropagation();
		if ( this.state.overlayMouseDown && this.props.onRequestClose && !preventCloseFlag ) {
			this.setState( { overlayMouseDown: false } );
			this.props.onRequestClose();
		}
	},

	// prevent clicks from propagating to background
	handleMouseEventModal: function( e ) {
		e.stopPropagation();
	},

	render: function() {
		var containerStyle, combinedStyle;

		var { style, className, width, title, ...other } = this.props;

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

		combinedStyle = assign( {}, style, containerStyle );
		return (
			<div className="dops-modal-wrapper" onClick={this.handleClickOverlay} onMouseDown={this.handleMouseDownOverlay}>
				<div className={classNames( 'dops-modal', className )}
					style={combinedStyle}
					onClick={this.handleMouseEventModal}
					onMouseDown={this.handleMouseEventModal}
					onMouseUp={this.handleMouseEventModal}
					role="dialog"
					aria-label={title}
					{ ...other }>
					{this.props.children}
				</div>
			</div>
		);
	}
} );

Modal.preventClose = preventClose;
Modal.allowClose = allowClose;

module.exports = Modal;
