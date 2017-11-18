/** External Dependencies **/
var React = require( 'react' );

/** Internal Dependencies **/
var Button = require( '../button' );

module.exports = React.createClass( {
	displayName: 'Submit',

	render: function() {
		var { ...other } = this.props;

		return (
			<Button {...other} type="submit">{this.props.children}</Button>
		);
	}
} );
