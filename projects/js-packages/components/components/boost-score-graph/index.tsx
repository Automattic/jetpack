import React, { type FunctionComponent } from 'react';
import Text from '../text';
import Background from './background';
import UplotLineChart from './uplot-line-chart';
import './style.scss';

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
export interface Annotation {
	timestamp: number;
	text: string;
	line?: HTMLElement;
}
export interface BoostScoreGraphProps {
	periods?: Period[];
	annotations?: Annotation[];
	startDate?: number;
	endDate?: number;
	title?: string;
	isPlaceholder?: boolean;
}

export type ScoreGraphAlignedData = [
	number[], // timestamps
	number[], // desktop_overall_score
	number[], // mobile_overall_score
];

/**
 * BoostScoreGraph component composed by the chart and the legend.
 *
 * @param {BoostScoreGraphProps} props - The props object for the BoostScoreGraph component.
 * @param {string} props.title - Title for the chart.
 * @param {Period[]} props.periods - The periods to display in the chart.
 * @param {boolean} [props.isLoading=false] - Whether the component is in a loading state.
 * @returns {React.ReactElement} The JSX element representing the BoostScoreGraph component, or null if loading.
 */
export const BoostScoreGraph: FunctionComponent< BoostScoreGraphProps > = ( {
	periods = [],
	annotations = [],
	startDate = 0,
	endDate = 0,
	title,
	isPlaceholder = false,
} ) => {
	// Sort periods by timestamp
	periods.sort( ( a, b ) => a.timestamp - b.timestamp );

	// @todo Remove this once we have a proper date range picker
	const dayBeforeEndDate = endDate - 24 * 60 * 60 * 1000;
	// Adjust the start date based on available data
	if ( periods.length === 0 ) {
		startDate = dayBeforeEndDate;
	} else if ( periods.length === 1 ) {
		startDate = Math.min( periods[ 0 ].timestamp - 12 * 60 * 60 * 1000, dayBeforeEndDate );
	} else {
		startDate = Math.min( periods[ 0 ].timestamp, dayBeforeEndDate );
	}

	// Add a fake period before the start date to make the chart look better
	if ( periods.length > 0 ) {
		periods = [
			{
				timestamp: startDate - 24 * 60 * 60 * 1000,
				dimensions: periods[ 0 ].dimensions,
			},
			...periods,
		];
	}

	return (
		<div className="jb-score-graph">
			{ title && <Text variant="title-medium">{ title }</Text> }
			{ isPlaceholder ? (
				<div className="jb-score-graph__placeholder">
					<Background />
				</div>
			) : (
				<UplotLineChart
					periods={ periods }
					annotations={ annotations }
					range={ { startDate, endDate } }
				/>
			) }
		</div>
	);
};

export default BoostScoreGraph;
