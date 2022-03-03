/**
 * External dependencies
 */
import React from 'react';
import Chart from 'chart.js/auto';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export class BarChart extends React.Component {
	constructor( props ) {
		super( props );
		this.canvasRef = React.createRef();
	}

	componentDidMount() {
		this.myChart = new Chart( this.canvasRef.current, {
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
								return ! legendItem.text.includes( 'Remaining' );
							},
						},
					},
				},
			},

			data: {
				labels: [ '' ], // this empty label must remain, if removed the entire chart breaks
				datasets: this.props.data.map( d => d.data ),
			},
		} );

		if ( this.props.isValid === true ) {
			// eslint-disable-next-line react/no-did-mount-set-state
			this.setState( { legendItems: this.myChart.legend.legendItems } );
		}
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
								'Text alternative for this canvas graphic is in the data table below',
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
											return <th scope="col">{ item.text }</th>;
										} ) }
								</tr>
								<tr>
									<th scope="row">{ __( 'Record Count', 'jetpack-search-pkg' ) }</th>
									{ this.state?.legendItems.length &&
										this.state.legendItems.map( item => {
											return <td>{ this.props.data[ item.datasetIndex ].data.data }</td>;
										} ) }
								</tr>
							</tbody>
						</table>
					</canvas>
				</div>
				<div className="jp-search-chart-legend__container">
					<ul className="jp-search-chart-legend">
						{ this.state?.legendItems.length > 0 &&
							this.state.legendItems.map( item => {
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
