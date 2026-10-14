import { renderHook, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useTooltipPosition } from '../private/use-tooltip-position';

const renderChart = () => {
	const container = document.createElement( 'div' );
	const chart = document.createElement( 'div' );
	const tooltip = document.createElement( 'div' );
	tooltip.className = 'google-visualization-tooltip';
	chart.append( tooltip );
	container.append( chart );
	document.body.append( container );

	chart.getBoundingClientRect = () => new DOMRect( 100, 50, 400, 300 );
	Object.defineProperties( tooltip, {
		offsetParent: { value: chart },
		offsetWidth: { value: 80 },
		offsetHeight: { value: 40 },
	} );

	renderHook( () => useTooltipPosition( { current: container } ) );

	return { container, tooltip };
};

describe( 'useTooltipPosition', () => {
	afterEach( () => document.body.replaceChildren() );

	it.each( [
		[ 'beside the cursor', 200, 100, '110px', '60px' ],
		[ 'flipped left near the right edge', 480, 100, '290px', '60px' ],
	] )( 'moves the tooltip Google places %s', async ( _, clientX, clientY, left, top ) => {
		const { container, tooltip } = renderChart();

		await userEvent.pointer( { target: container, coords: { clientX, clientY } } );
		tooltip.style.left = '0px';
		tooltip.style.top = '0px';

		await waitFor( () => expect( tooltip ).toHaveStyle( { left, top } ) );
	} );
} );
