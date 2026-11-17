import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { isRTL } from '@wordpress/i18n';
import { act } from 'react';
import { CardTabs } from '../index';

jest.mock( '@wordpress/i18n', () => ( {
	...jest.requireActual( '@wordpress/i18n' ),
	isRTL: jest.fn( () => false ),
} ) );

const METRICS = [
	{ key: 'orders', label: 'Orders' },
	{ key: 'visitors', label: 'Visitors' },
	{ key: 'revenue', label: 'Revenue' },
];

function renderCardTabs( { disabledKey }: { disabledKey?: string } = {} ) {
	const onValueChange = jest.fn();

	render(
		<CardTabs.Root value="visitors" onValueChange={ onValueChange }>
			<CardTabs.List aria-label="Select metric">
				{ METRICS.map( metric => (
					<CardTabs.Tab
						key={ metric.key }
						value={ metric.key }
						disabled={ metric.key === disabledKey }
					>
						{ metric.label }
					</CardTabs.Tab>
				) ) }
			</CardTabs.List>
			{ METRICS.map( metric => (
				<CardTabs.Panel key={ metric.key } value={ metric.key }>
					{ metric.label } chart
				</CardTabs.Panel>
			) ) }
		</CardTabs.Root>
	);

	return { onValueChange };
}

describe( 'CardTabs', () => {
	beforeEach( () => {
		jest.mocked( isRTL ).mockReturnValue( false );
	} );

	it( 'shows the selected card’s panel, labelled by the card, and reports a click on another', async () => {
		const user = userEvent.setup();
		const { onValueChange } = renderCardTabs();

		const selected = screen.getByRole( 'tab', { name: 'Visitors' } );
		expect( selected ).toHaveAttribute( 'aria-selected', 'true' );
		expect( screen.getByRole( 'tabpanel' ) ).toHaveAttribute( 'aria-labelledby', selected.id );
		expect( screen.getByRole( 'tabpanel' ) ).toHaveTextContent( 'Visitors chart' );
		expect( screen.queryByText( 'Orders chart' ) ).not.toBeInTheDocument();

		await user.click( screen.getByRole( 'tab', { name: 'Orders' } ) );

		expect( onValueChange ).toHaveBeenCalledWith( 'orders', expect.anything() );
	} );

	it( 'moves between cards with the arrow keys and selects only on Enter', async () => {
		const user = userEvent.setup();
		const { onValueChange } = renderCardTabs( { disabledKey: 'revenue' } );

		act( () => screen.getByRole( 'tab', { name: 'Visitors' } ).focus() );
		await user.keyboard( '{ArrowLeft}' );

		expect( screen.getByRole( 'tab', { name: 'Orders' } ) ).toHaveFocus();
		expect( onValueChange ).not.toHaveBeenCalled();

		await user.keyboard( '{Enter}' );

		expect( onValueChange ).toHaveBeenCalledWith( 'orders', expect.anything() );
	} );

	it( 'follows the text direction, so the left arrow moves forward in RTL', async () => {
		jest.mocked( isRTL ).mockReturnValue( true );
		const user = userEvent.setup();
		renderCardTabs();

		act( () => screen.getByRole( 'tab', { name: 'Orders' } ).focus() );
		await user.keyboard( '{ArrowLeft}' );

		expect( screen.getByRole( 'tab', { name: 'Visitors' } ) ).toHaveFocus();
	} );
} );
