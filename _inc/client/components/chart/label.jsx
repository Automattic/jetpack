var PropTypes = require('prop-types');
/**
 * External dependencies
 */
var React = require( 'react' );

module.exports = React.createClass( {
	displayName: 'ModuleChartLabel',

	propTypes: {
		width: PropTypes.number.isRequired,
		x: PropTypes.number.isRequired,
		label: PropTypes.string.isRequired
	},

	render: function() {
		var labelStyle,
			dir = 'left';

		labelStyle = {
			width: this.props.width + 'px'
		};

		labelStyle[ dir ] = this.props.x + 'px';

		return <div className="dops-chart__x-axis-label" style={ labelStyle }>{ this.props.label }</div>;
	}
} );
