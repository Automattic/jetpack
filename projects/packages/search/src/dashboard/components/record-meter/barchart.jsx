/**
 * External dependencies
 */
import React from 'react';
const Chart = React.lazy( () => import( 'chart.js/auto' ) );

/**
 * Internal dependencies
 */

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
							filter: function ( legendItem, data ) {
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
			this.setState( { legendItems: this.myChart.legend.legendItems } );
		}
	}

	render() {
		if ( this.props.isValid === false ) {
			return null;
		}
		return (
			<div className="barChart">
				<div className="chartContainer">
					<canvas ref={ this.canvasRef }>
						<p>Text alternative for this canvas graphic is in the data table below.</p>
						<table
							border="0"
							cellPadding="5"
							summary="This is the text alternative for the canvas graphic."
						>
							<caption>Records Indexed for Jetpack Search</caption>
							<tbody>
								<tr>
									<th scope="col">Post Type</th>
									{ this.state?.legendItems.length &&
										this.state.legendItems.map( item => {
											return <th scope="col">{ item.text }</th>;
										} ) }
								</tr>
								<tr>
									<th scope="row">Record Count</th>
									{ this.state?.legendItems.length &&
										this.state.legendItems.map( item => {
											return <td>{ this.props.data[ item.datasetIndex ].data.data }</td>;
										} ) }
								</tr>
							</tbody>
						</table>
					</canvas>
				</div>
				<div className="chartLegendContainer">
					<ul className="chartLegend">
						{ this.state?.legendItems.length > 0 &&
							this.state.legendItems.map( item => {
								return (
									<li key={ item.text }>
										<div
											className="chartLegendBox"
											style={ {
												backgroundColor: item.fillStyle,
											} }
										/>
										<span className="chartLegendLabel" children={ item.text } />
										<span className="chartLegendCount">
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
