var PropTypes = require('prop-types');
/** External Dependencies **/
var React = require( 'react' );

module.exports = React.createClass( {
	displayName: 'Section',

	propTypes: {
		title: PropTypes.any,
		id: PropTypes.string
	},

	render: function() {
		return (
			<div id={this.props.id}>
				{this.props.title ?
					(
						<div>
							<div className="dops-form-section-title">{this.props.title}</div>
							<div className="dops-form-section-body">
								{this.props.children}
							</div>
						</div>
					) :
					( this.props.children )
				}
			</div>
		);
	}
} );
