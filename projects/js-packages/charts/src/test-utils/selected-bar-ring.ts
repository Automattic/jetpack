import { screen } from '@testing-library/react';

const NUMBER = /-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi;

/**
 * The box the bar chart's selected ring outlines, read from its path.
 *
 * @return The ring's x, y, width and height.
 */
export const selectedBarRingBounds = () => {
	const d = screen.getByTestId( 'bar-chart-selected-ring' ).getAttribute( 'd' ) ?? '';
	const [ x, y, width, height ] = ( d.match( NUMBER ) ?? [] ).map( Number );
	return { x, y, width, height };
};
