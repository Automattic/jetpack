import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import PeriodSelector from '../index.tsx';

const presets = [
	{ value: '7', label: 'Last 7 days' },
	{ value: '30', label: 'Last 30 days' },
];

describe( 'PeriodSelector', () => {
	it( 'names the trigger by its label and the selected period, and the menu by its label', async () => {
		const user = userEvent.setup();
		render(
			<PeriodSelector label="Date range" presets={ presets } value="30" onChange={ jest.fn() } />
		);

		await user.click( screen.getByRole( 'button', { name: 'Date range: Last 30 days' } ) );

		await expect(
			screen.findByRole( 'menu', { name: 'Date range' } )
		).resolves.toBeInTheDocument();
	} );
} );
