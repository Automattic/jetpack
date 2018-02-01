var PropTypes = require( 'prop-types' );
/** External Dependencies **/
var React = require( 'react' ),
	Formsy = require( 'formsy-react' );

module.exports = React.createClass( {
	displayName: 'HiddenInput',

	mixins: [Formsy.Mixin],

	propTypes: {
		name: PropTypes.string.isRequired
	},

	render: function() {
		return (
			<input type="hidden" value={this.getValue()}/>
		);
	}
} );
