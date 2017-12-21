/**
 * External dependencies
 */
var React = require( 'react' ),
	classnames = require( 'classnames' ),
	omit = require( 'lodash/omit' );

require( './style.scss' );

module.exports = React.createClass( {

	displayName: 'Textarea',

	render: function() {
		return (
			<textarea { ...omit( this.props, 'className' ) } className={ classnames( this.props.className, 'dops-textarea' ) } >
				{ this.props.children }
			</textarea>
		);
	}
} );
