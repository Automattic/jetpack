/** External Dependencies **/
var PropTypes = require( 'prop-types' );
var React = require( 'react' );

module.exports = React.createClass( {
	displayName: 'ActionBar',

	propTypes: {
		style: PropTypes.object
	},

	render: function() {
		return (
			<div className="dops-form-actionbar" style={this.props.style}>
				{this.props.children}
			</div>
		);
	}
} );
