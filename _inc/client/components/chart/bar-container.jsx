/**
 * External dependencies
 */
var React = require( 'react' );

/**
 * Internal dependencies
 */
var Bar = require( './bar' ),
	XAxis = require( './x-axis' );

module.exports = React.createClass( {
	displayName: 'ModuleChartBarContainer',

	propTypes: {
		isTouch: React.PropTypes.bool,
		data: React.PropTypes.array,
		yAxisMax: React.PropTypes.number,
		width: React.PropTypes.number,
		barClick: React.PropTypes.func
	},

	buildBars: function( max ) {
		var bars,
			numberBars = this.props.data.length,
			tooltipPosition = 'bottom right',
			width = this.props.chartWidth,
			barWidth = ( width / numberBars );

		bars = this.props.data.map( function ( item, index ) {
			var barOffset = barWidth * ( index + 1 );

			if (
					( ( barOffset + 230 ) > width ) &&
					( ( ( barOffset + barWidth ) - 230 ) > 0 )
				) {
				tooltipPosition = 'bottom left';
			}

			return <Bar index={ index }
						key={ index }
						isTouch={ this.props.isTouch }
						tooltipPosition={ tooltipPosition }
						className={ item.className }
						clickHandler={ this.props.barClick }
						data={ item }
						max={ max }
						count={ numberBars } />;
		}, this );

		return bars;
	},

	render: function() {
		return (
			<div>
				<div className="dops-chart__bars">
					{ this.buildBars( this.props.yAxisMax ) }
				</div>
				<XAxis data={ this.props.data } labelWidth={ 42 } />
			</div>
		);
	}
} );
