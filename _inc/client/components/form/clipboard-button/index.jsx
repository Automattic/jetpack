/**
 * External dependencies
 */
var ReactDom = require( 'react-dom' ),
	React = require( 'react' ),
	Clipboard = require( 'clipboard' ),
	omit = require( 'lodash/omit' ),
	noop = require( 'lodash/noop' ),
	classNames = require( 'classnames' );

/**
 * Internal dependencies
 */
import Button from 'components/button';

module.exports = React.createClass( {
	displayName: 'ClipboardButton',

	propTypes: {
		className: React.PropTypes.string,
		text: React.PropTypes.string,
		prompt: React.PropTypes.string,
		onCopy: React.PropTypes.func
	},

	getDefaultProps: function() {
		return {
			onCopy: noop
		};
	},

	componentDidMount: function() {
		var button = ReactDom.findDOMNode( this.refs.button );
		this.clipboard = new Clipboard( button, {
			text: () => this.props.text
		} );
		this.clipboard.on( 'success', this.props.onCopy );
		this.clipboard.on( 'error', this.displayPrompt );
	},

	componentWillUnmount: function() {
		this.clipboard.destroy();
		delete this.clipboard;
	},

	displayPrompt: function() {
		window.prompt( this.props.prompt, this.props.text );
	},

	render: function() {
		var classes = classNames( 'dops-clipboard-button', this.props.className );
		return (
			<Button
				ref="button"
				{ ...omit( this.props, Object.keys( this.constructor.propTypes ) ) }
				className={ classes } />
		);
	}
} );
