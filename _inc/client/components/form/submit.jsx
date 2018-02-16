/** External Dependencies **/
const React = require( 'react' );

/** Internal Dependencies **/
const Button = require( '../button' );

module.exports = React.createClass( {
	displayName: 'Submit',

	render: function() {
		let { ...other } = this.props;

		return (
			<Button { ...other } type="submit">{this.props.children}</Button>
		);
	}
} );
