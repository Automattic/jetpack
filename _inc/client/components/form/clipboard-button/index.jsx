/**
 * External dependencies
 */
const PropTypes = require( 'prop-types' );
const ReactDom = require( 'react-dom' ),
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
		className: PropTypes.string,
		text: PropTypes.string,
		prompt: PropTypes.string,
		onCopy: PropTypes.func
	},

	getDefaultProps: function() {
		return {
			onCopy: noop
		};
	},

	componentDidMount: function() {
		const button = ReactDom.findDOMNode( this.refs.button );
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
		const classes = classNames( 'dops-clipboard-button', this.props.className );
		return (
			<Button
				ref="button"
				{ ...omit( this.props, Object.keys( this.constructor.propTypes ) ) }
				className={ classes } />
		);
	}
} );
