import React, { type FunctionComponent } from 'react';
import uPlot from 'uplot';
import Text from '../text';
import UplotLineChart from './uplot-line-chart';
import { useBoostScoreTransform } from './use-boost-score-transform';

export interface Period {
	timestamp: number;
	dimensions: {
		desktop_overall_score: number;
		desktop_lcp: number;
		desktop_cls: number;
		desktop_tbt: number;
		mobile_overall_score: number;
		mobile_lcp: number;
		mobile_cls: number;
		mobile_tbt: number;
	};
}
export interface BoostScoreGraphProps {
	periods: Period[];
	startDate: number;
	endDate: number;
	title?: string;
	isLoading?: boolean;
}

/**
 * BoostScoreGraph component composed by the chart and the legend.
 *
 * @param {BoostScoreGraphProps} props - The props object for the BoostScoreGraph component.
 * @param {uPlot.AlignedData} props.data - The data used to render the uPlotLineChart.
 * @param {string} props.title - Title for the chart.
 * @param {boolean} [props.isLoading=false] - Whether the component is in a loading state.
 * @returns {React.ReactElement} The JSX element representing the BoostScoreGraph component, or null if loading.
 */
export const BoostScoreGraph: FunctionComponent< BoostScoreGraphProps > = ( {
	periods,
	startDate,
	endDate,
	title,
	isLoading = false,
} ) => {
	// Sort periods by timestamp
	periods.sort( ( a, b ) => a.timestamp - b.timestamp );

	// @todo Remove this once we have a proper date range picker
	const dayBeforeEndDate = endDate - 24 * 60 * 60 * 1000;
	// Adjust the start date based on available data
	if ( periods.length > 0 ) {
		startDate = Math.min( periods[ 0 ].timestamp - 12 * 60 * 60 * 1000, dayBeforeEndDate );
	} else {
		startDate = dayBeforeEndDate;
	}

	const data = useBoostScoreTransform( periods );
	if ( isLoading || ! data?.length ) {
		return null;
	}
	return (
		<div className="jb-score-graph">
			{ title && <Text variant="title-medium">{ title }</Text> }
			<UplotLineChart data={ data } periods={ periods } range={ { startDate, endDate } } />
		</div>
	);
};

export default BoostScoreGraph;
