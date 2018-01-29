/** External Dependencies **/
var React = require( 'react' );

module.exports = React.createClass( {
	displayName: 'Row',

	render: function() {
		return (
			<div className="dops-form-row">
				{this.props.children}
			</div>
		);
	}
} );
