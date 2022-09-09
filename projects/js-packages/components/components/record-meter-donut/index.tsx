import React from 'react';
import './style.scss';

export type DonutMeterProps = {
	/**
	 * Total number of items for the donut meter.
	 */
	totalCount: number;
	/**
	 * Count for the given item
	 */
	segmentCount: number;
	/**
	 * Color code for the background color for the item.
	 * If not provided, defaults to Jetpack Green
	 */
	backgroundColor?: string;

	/**
	 * thickness for the chart border
	 * If not provided, defaults to 3.5
	 */
	thickness?: string;
	/**
	 * width for the full chart size
	 * If not provided, defaults to 64px
	 */
	donutWidth?: string;

	/**
	 * Localized title for meter.
	 * Not visible. Used for a11y support.
	 * If not provided, defaults to an empty string.
	 */
	title?: string;

	/**
	 * Localized description for meter.
	 * Not visible. Used for a11y support.
	 * If not provided, defaults to an empty string.
	 */
	description?: string;
};

/**
 * Generate record meter donut bar
 *
 * @param {DonutMeterProps} props - Props
 * @returns {React.ReactElement} - JSX element
 */
const DonutMeter: React.FC< DonutMeterProps > = ( {
	totalCount,
	segmentCount,
	backgroundColor = '#00BA37', // jetpack green fallback
	thickness = '3.5',
	donutWidth = '64px',
	title = '',
	description = ''
} ) => {
	const count = () => {
		// get count as a percent value
		return ( segmentCount / totalCount ) * 100;
	};

	return (
		<div className="donut-meter">
			<svg
				width={ donutWidth }
				height="auto"
				viewBox="0 0 40 40"
				className="donut-meter_svg"
				data-testid="donut-meter_svg"
				role="img"
			>
				<title id="donut-meter-title">{ title }</title>
				<desc id="donut-meter-description">{ description }</desc>
				<circle
					className="donut-meter-hole"
					cx="20" // center x value of circle
					cy="20" // center y value of circle
					r="15.91549430918954" // radius based on the circumference r = 100/(2π)
					fill="transparent"
				></circle>
				<circle
					className="donut-meter-ring"
					cx="20"
					cy="20"
					r="15.91549430918954"
					fill="transparent"
					strokeWidth={ thickness }
					stroke="#ebebeb"
				></circle>
				<circle
					className="donut-meter-segment"
					cx="20"
					cy="20"
					r="15.91549430918954"
					fill="transparent"
					transform-origin="center"
					stroke={ backgroundColor }
					strokeWidth={ thickness }
					strokeDasharray={ `${ count() } ${ 100 - count() }` }
					strokeDashoffset="-25" // this ensures the segment begins at the bottom of the donut instead of the top
				></circle>
			</svg>
		</div>
	);
};

export default DonutMeter;
