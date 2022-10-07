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
	 * Dictates the segment color of the donut meter. Defaults to 'success' and overrides useAdaptiveColors.
	 * Possible values:
	 * - 'info': blue donut
	 * - 'warning': yellow donut
	 * - 'error': red donut
	 * - 'success': green donut
	 */
	type?: string;

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

	/**
	 * Changes colors according to  description for meter.
	 * Not visible. Used for a11y support.
	 * If not provided, defaults to an empty string.
	 */
	useAdaptiveColors?: boolean;

	/**
	 * Class name to append to the topmost container.
	 */
	className?: string;
};

const getAdaptiveType = ( percentage: number ) => {
	if ( percentage < 50 ) {
		return 'success';
	}
	if ( percentage < 100 ) {
		return 'warning';
	}
	return 'danger';
};

/**
 * Generate record meter donut bar
 *
 * @param {DonutMeterProps} props - Props
 * @returns {React.ReactElement} - JSX element
 */
const DonutMeter: React.FC< DonutMeterProps > = ( {
	className = '',
	description = '',
	donutWidth = '64px',
	segmentCount,
	thickness = '3.5',
	title = '',
	totalCount,
	type,
	useAdaptiveColors,
} ) => {
	const validDivisor = totalCount === 0 ? 1 : totalCount;
	const percentage = ( segmentCount / validDivisor ) * 100;

	// If we don't have a title or description, hide the meter from screen readers.
	const isHidden =
		typeof title === 'string' &&
		title.length === 0 &&
		typeof description === 'string' &&
		description.length === 0
			? 'true'
			: 'false';

	const finalClassName = `donut-meter ${ className ? className + ' ' : '' }${
		type ? 'is-' + type + ' ' : ''
	} ${ ! type && useAdaptiveColors ? 'is-' + getAdaptiveType( percentage ) + ' ' : '' }`.trim();

	return (
		<div className={ finalClassName } aria-hidden={ isHidden } data-testid="donut-meter">
			<svg
				width={ donutWidth }
				height={ donutWidth }
				viewBox="0 0 40 40"
				className="donut-meter_svg"
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
					strokeWidth={ thickness }
					strokeDasharray={ `${ percentage } ${ 100 - percentage }` }
					strokeDashoffset="-25" // this ensures the segment begins at the bottom of the donut instead of the top
				></circle>
			</svg>
		</div>
	);
};

export default DonutMeter;
