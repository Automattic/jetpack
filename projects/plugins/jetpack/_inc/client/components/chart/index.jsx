import { _x } from '@wordpress/i18n';
import { hasTouch } from 'lib/touch-detect';
import { noop, throttle } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import BarContainer from './bar-container';
import './style.scss';

export default class ModuleChart extends React.Component {
	static displayName = 'ModuleChart';

	static propTypes = {
		loading: PropTypes.bool,
		data: PropTypes.array,
		minTouchBarWidth: PropTypes.number,
		minBarWidth: PropTypes.number,
		barClick: PropTypes.func,
	};

	static defaultProps = {
		minTouchBarWidth: 42,
		minBarWidth: 15,
		barClick: noop,
	};

	state = {
		maxBars: 100, // arbitrarily high number. This will be calculated by resize method
		width: 650,
	};

	// Add listener for window resize
	componentDidMount() {
		this.resize = throttle( this.resize, 400 );
		window.addEventListener( 'resize', this.resize );
		this.resize();
	}

	// Remove listener
	componentWillUnmount() {
		window.removeEventListener( 'resize', this.resize );
	}

	UNSAFE_componentWillReceiveProps( nextProps ) {
		if ( this.props.loading && ! nextProps.loading ) {
			this.resize();
		}
	}

	resize = () => {
		const node = this.refs.chart;
		let width = node.clientWidth - 82,
			maxBars;

		if ( hasTouch() ) {
			width = width <= 0 ? 350 : width; // mobile safari bug with zero width
			maxBars = Math.floor( width / this.props.minTouchBarWidth );
		} else {
			maxBars = Math.floor( width / this.props.minBarWidth );
		}

		this.setState( {
			maxBars: maxBars,
			width: width,
		} );
	};

	getYAxisMax = values => {
		const max = Math.max.apply( null, values ),
			operand = Math.pow( 10, max.toString().length - 1 );
		let rounded = Math.ceil( ( max + 1 ) / operand ) * operand;

		if ( rounded < 10 ) {
			rounded = 10;
		}

		return rounded;
	};

	getData = () => {
		let data = this.props.data;

		data = data.slice( 0 - this.state.maxBars );

		return data;
	};

	getValues = () => {
		let data = this.getData();

		data = data.map( function ( item ) {
			return item.value;
		}, this );

		return data;
	};

	isEmptyChart = values => {
		values = values.filter( function ( value ) {
			return value > 0;
		}, this );

		return values.length === 0;
	};

	render() {
		const values = this.getValues(),
			yAxisMax = this.getYAxisMax( values ),
			data = this.getData();
		let emptyChart;

		// If we have an empty chart, show a message
		// @todo this message needs to either use a <Notice> or make a custom "chart__notice" class
		if ( values.length && this.isEmptyChart( values ) ) {
			emptyChart = (
				<div className="dops-chart__empty">
					<span className="dops-chart__empty_notice">
						{ _x( 'No activity this period', 'Notice in the empty statistics chart', 'jetpack' ) }
					</span>
				</div>
			);
		}

		return (
			<div ref="chart" className="dops-chart">
				<div className="dops-chart__y-axis-markers">
					<div className="dops-chart__y-axis-marker is-hundred" />
					<div className="dops-chart__y-axis-marker is-fifty" />
					<div className="dops-chart__y-axis-marker is-zero" />
				</div>
				<div className="dops-chart__y-axis">
					<div className="dops-chart__y-axis-width-fix">
						{ new Number( 100000 ).toLocaleString() }
					</div>
					<div className="dops-chart__y-axis-label is-hundred">{ yAxisMax.toLocaleString() }</div>
					<div className="dops-chart__y-axis-label is-fifty">
						{ ( yAxisMax / 2 ).toLocaleString() }
					</div>
					<div className="dops-chart__y-axis-label is-zero">{ 0 }</div>
				</div>
				<BarContainer
					barClick={ this.props.barClick }
					data={ data }
					yAxisMax={ yAxisMax }
					chartWidth={ this.state.width }
					isTouch={ hasTouch() }
				/>
				{ emptyChart }
			</div>
		);
	}
}
