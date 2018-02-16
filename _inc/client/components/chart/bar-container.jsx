/**
 * External dependencies
 */
const PropTypes = require( 'prop-types' );
const React = require( 'react' );

/**
 * Internal dependencies
 */
const Bar = require( './bar' ),
	XAxis = require( './x-axis' );

module.exports = React.createClass( {
	displayName: 'ModuleChartBarContainer',

	propTypes: {
		isTouch: PropTypes.bool,
		data: PropTypes.array,
		yAxisMax: PropTypes.number,
		width: PropTypes.number,
		barClick: PropTypes.func
	},

	buildBars: function( max ) {
		const numberBars = this.props.data.length,
			width = this.props.chartWidth,
			barWidth = ( width / numberBars );
		let tooltipPosition = 'bottom right';
		const bars = this.props.data.map( function( item, index ) {
			const barOffset = barWidth * ( index + 1 );

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
