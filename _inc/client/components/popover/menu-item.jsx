/**
 * External dependencies
 */
const React = require( 'react' ),
	noop = require( 'lodash/noop' ),
	classnames = require( 'classnames' );

const MenuItem = React.createClass( {
	getDefaultProps: function() {
		return {
			isVisible: false,
			className: '',
			focusOnHover: true
		};
	},

	render: function() {
		const onMouseOver = this.props.focusOnHover ? this._onMouseOver : null;
		return (
			<button className={ classnames( 'dops-popover__menu-item', this.props.className ) }
					role="menuitem"
					disabled={ this.props.disabled }
					onClick={ this.props.onClick }
					onMouseOver={ onMouseOver }
					onFocus={ noop }
					tabIndex="-1">
				{ this.props.children }
			</button>
		);
	},

	_onMouseOver: function( event ) {
		event.target.focus();
	}
} );

module.exports = MenuItem;
