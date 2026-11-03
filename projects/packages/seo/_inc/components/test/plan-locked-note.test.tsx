import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';

jest.unstable_mockModule( '../../data/is-gated', () => ( {
	getUpsellUrl: () => 'https://wordpress.com/checkout/example.com/value_bundle',
} ) );

const { default: PlanLockedNote } = await import( '../plan-locked-note' );
const { consumePendingUpgrade } = await import( '../../data/upgrade' );

it( 'connects a card upgrade link to the existing return-from-checkout reload', () => {
	window.sessionStorage.clear();
	render( <PlanLockedNote /> );
	const upgrade = screen.getByRole( 'link', { name: /^Upgrade/ } );
	expect( upgrade ).toHaveAttribute(
		'href',
		'https://wordpress.com/checkout/example.com/value_bundle'
	);
	expect( upgrade ).not.toHaveAttribute( 'target', '_blank' );
	// eslint-disable-next-line testing-library/prefer-user-event -- Only the link's click handler is needed.
	fireEvent.click( upgrade );
	expect( consumePendingUpgrade() ).toBe( true );
	expect( consumePendingUpgrade() ).toBe( false );
} );
