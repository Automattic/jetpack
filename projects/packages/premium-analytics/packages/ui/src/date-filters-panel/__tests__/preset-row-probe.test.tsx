import { render, screen } from '@testing-library/react';
import { PresetRowProbe } from '../preset-row-probe';

const presets = [
	{ id: 'last-7-days', label: '7 days' },
	{ id: 'last-30-days', label: '30 days' },
];

function renderProbe( customTriggerLabel: string | undefined = 'Custom' ) {
	return render(
		<PresetRowProbe
			presets={ presets }
			customTriggerLabel={ customTriggerLabel }
			interval={ <button type="button">Chart interval</button> }
			comparison={ <button type="button">Add comparison</button> }
			onMeasure={ jest.fn() }
		/>
	);
}

describe( 'PresetRowProbe', () => {
	// Widths are all 0 in jsdom, so what is worth pinning is which element the
	// measurement is taken from and what sits inside it.
	it( 'measures the interval and comparison controls as part of the row', () => {
		const { container } = renderProbe();

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the assertion is the DOM structure: the controls have to sit inside the element handed to `getBoundingClientRect`.
		const measured = container.querySelector( '.preset-row-probe__panel' );

		expect( measured ).toContainElement( screen.getByText( 'Chart interval' ) );
		expect( measured ).toContainElement( screen.getByText( 'Add comparison' ) );
		expect( measured ).toContainElement( screen.getByText( '7 days' ) );
	} );

	it( 'keeps its copy of the row out of the accessibility tree', () => {
		renderProbe();

		// The panel renders each control element twice, here and in the row the
		// user operates. Only the second may be reachable.
		expect( screen.queryByRole( 'button', { name: 'Chart interval' } ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Add comparison' } ) ).not.toBeInTheDocument();
	} );

	it( 'mirrors the custom trigger only when the row has one', () => {
		const { rerender } = renderProbe( 'Custom' );
		expect( screen.getByText( 'Custom' ) ).toBeInTheDocument();

		rerender(
			<PresetRowProbe
				presets={ presets }
				customTriggerLabel={ undefined }
				onMeasure={ jest.fn() }
			/>
		);
		expect( screen.queryByText( 'Custom' ) ).not.toBeInTheDocument();
	} );
} );
