/**
 * External dependencies
 */
import React from 'react';
import Chart from 'chart.js/auto';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const CHART_OPTIONS = {
	type: 'bar',
	options: {
		borderRadius: 100,
		borderSkipped: 'middle',
		indexAxis: 'y',
		maintainAspectRatio: false,
		aspectRatio: 1.3,
		scales: {
			x: {
				stacked: true,
				grid: {
					display: false,
					drawBorder: false,
				},
				ticks: {
					display: false,
				},
			},
			y: {
				stacked: true,
				grid: {
					display: false,
					drawBorder: false,
				},
				ticks: {
					display: false,
				},
			},
		},

		plugins: {
			title: {
				display: false,
			},
			subtitle: {
				display: false,
			},
			legend: {
				display: false,

				labels: {
					filter: function ( legendItem ) {
						return ! legendItem.text.includes( __( 'Remaining', 'jetpack-search-pkg' ) );
					},
				},
			},
		},
	},
};

export class BarChart extends React.Component {
	constructor( props ) {
		super( props );
		this.canvasRef = React.createRef();
	}

	componentDidMount() {
		this.myChart = new Chart( this.canvasRef.current, {
			...CHART_OPTIONS,
			data: {
				labels: [ '' ], // this empty label must remain, if removed the entire chart breaks
				datasets: this.props.data.map( d => d.data ),
			},
		} );

		// Force re-render after mounting chart to ensure correct value for this.getLegendItems().
		this.forceUpdate();
	}

	getLegendItems() {
		return this.myChart?.legend.legendItems ?? [];
	}

	render() {
		if ( this.props.isValid === false ) {
			return null;
		}

		return (
			<div className="jp-search-bar-chart">
				<div className="jp-search-bar-chart__container">
					<canvas ref={ this.canvasRef }>
						<p>
							{ __(
								'Text alternative for this chart is in the data table below',
								'jetpack-search-pkg'
							) }
						</p>
						<table
							border="0"
							cellPadding="5"
							summary="This is the text alternative for the canvas graphic."
						>
							<caption>
								{ __( 'Records Indexed for Jetpack Search', 'jetpack-search-pkg' ) }
							</caption>
							<tbody>
								<tr>
									<th scope="col">{ __( 'Post type', 'jetpack-search-pkg' ) }</th>
									{ this.state?.legendItems.length &&
										this.state.legendItems.map( item => {
											return (
												<th key={ item.text } scope="col">
													{ item.text }
												</th>
											);
										} ) }
								</tr>
								<tr>
									<th scope="row">{ __( 'Record count', 'jetpack-search-pkg' ) }</th>
									{ this.state?.legendItems.length &&
										this.state.legendItems.map( item => {
											return (
												<td key={ item.text }>
													{ this.props.data[ item.datasetIndex ].data.data }
												</td>
											);
										} ) }
								</tr>
							</tbody>
						</table>
					</canvas>
				</div>
				<div className="jp-search-chart-legend__container">
					<ul className="jp-search-chart-legend">
						{ this.getLegendItems().map( item => {
							return (
								<li key={ item.text }>
									<div
										className="jp-search-chart-legend__box"
										style={ {
											backgroundColor: item.fillStyle,
										} }
									/>
									<span className="jp-search-chart-legend__label" children={ item.text } />
									<span className="jp-search-chart-legend__count">
										({ this.props.data[ item.datasetIndex ].data.data })
									</span>
								</li>
							);
						} ) }
					</ul>
				</div>
			</div>
		);
	}
}
