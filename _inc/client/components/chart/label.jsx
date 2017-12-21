/**
 * External dependencies
 */
var React = require( 'react' );

module.exports = React.createClass( {
	displayName: 'ModuleChartLabel',

	propTypes: {
		width: React.PropTypes.number.isRequired,
		x: React.PropTypes.number.isRequired,
		label: React.PropTypes.string.isRequired
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
