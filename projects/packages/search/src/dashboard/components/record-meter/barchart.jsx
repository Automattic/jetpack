/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
const ChartJS = React.lazy( () => import( 'chart.js' ) );
const { Chart, registerables } = ChartJS;
Chart.register( ...registerables );

export class BarChart extends React.Component {
	// constructor( props ) {
	// 	super( props );
	// 	this.canvasRef = React.createRef();
	// }
}
