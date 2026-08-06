import { render, screen } from '@testing-library/react';
import { PresetRowProbe } from '../preset-row-probe';

const presets = [
	{ id: 'last-7-days', label: 'Last 7 days' },
	{ id: 'last-30-days', label: 'Last 30 days' },
];

function renderProbe() {
	return render(
		<PresetRowProbe
			presets={ presets }
			customTriggerLabel="Custom"
			comparison={ <button type="button">Add comparison</button> }
			onMeasure={ jest.fn() }
		/>
	);
}

describe( 'PresetRowProbe', () => {
	/*
	 * Widths are all 0 in jsdom, so what is worth pinning here is which element
	 * the measurement is taken from and what sits inside it.
	 */
	it( 'measures the comparison control as part of the row', () => {
		const { container } = renderProbe();

		/*
		 * Reaching for the node directly is the point: the assertion is that the
		 * comparison control sits inside the element handed to
		 * `getBoundingClientRect`. Measured outside it, the control takes room
		 * the presets never learn about, which is how the `+` came to overflow
		 * the section header.
		 */
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- see above.
		const measured = container.querySelector( '.preset-row-probe__panel' );

		expect( measured ).toContainElement( screen.getByText( 'Add comparison' ) );
		expect( measured ).toContainElement( screen.getByText( 'Last 7 days' ) );
	} );

	it( 'keeps its copy of the row out of the accessibility tree', () => {
		renderProbe();

		// The panel renders one comparison element in two places, here and in
		// the row the user operates. Only the second may be reachable, or every
		// query for the control matches twice.
		expect( screen.queryByRole( 'button', { name: 'Add comparison' } ) ).not.toBeInTheDocument();
	} );
} );
