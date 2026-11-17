import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import ThreatFixerButton from '../index.tsx';

describe( 'ThreatFixerButton', () => {
	it( 'gives a failed fixer button its error reason as an accessible description', () => {
		const threat = { id: 1, fixable: { fixer: 'update' }, fixer: { error: 'not_found' } };

		render( <ThreatFixerButton threat={ threat } onClick={ jest.fn() } /> );

		expect( screen.getByRole( 'button', { name: 'Error' } ) ).toHaveAccessibleDescription(
			'An error occurred auto-fixing this threat.'
		);
	} );
} );
