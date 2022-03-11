/**
 * External dependencies
 */
import { Chart, ChartConfiguration } from 'chart.js';

/**
 * @type {ChartConfiguration['options']}
 */
export const CHART_OPTIONS = {
	borderRadius: 100,
	borderSkipped: 'middle',
	indexAxis: 'y',
	maintainAspectRatio: false,
	layout: {
		autoPadding: true,
	},
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
		legend: {
			display: true,
			position: 'bottom',
			align: 'start',
			onClick: null,
			labels: {
				boxHeight: 15,
				boxWidth: 15,
				generateLabels: chart => {
					const items = Chart.defaults.plugins.legend.labels.generateLabels( chart );

					const datasets = chart.data.datasets;

					for ( const item of items ) {
						item.borderRadius = 7.5; // half of boxHeight and boxWidth
						// Add the count to legend label
						item.text = datasets[ item.datasetIndex ].data[ 0 ] + ' ' + item.text;
					}

					return items;
				},
			},
		},
	},
};
