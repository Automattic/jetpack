import { render, screen } from '@testing-library/react';
import SocialGate from '..';

jest.mock( '../connection-gate', () => () => <div>connection-gate</div> );
jest.mock( '../pricing-gate', () => () => <div>pricing-gate</div> );
jest.mock( '../activation-gate', () => () => <div>activation-gate</div> );

describe( 'SocialGate (presentational)', () => {
	it( 'renders ConnectionGate when gate="connection"', () => {
		render(
			<SocialGate gate="connection" onDismissPricing={ jest.fn() }>
				<div>tabs</div>
			</SocialGate>
		);
		expect( screen.getByText( 'connection-gate' ) ).toBeInTheDocument();
	} );

	it( 'renders PricingGate when gate="pricing"', () => {
		render(
			<SocialGate gate="pricing" onDismissPricing={ jest.fn() }>
				<div>tabs</div>
			</SocialGate>
		);
		expect( screen.getByText( 'pricing-gate' ) ).toBeInTheDocument();
	} );

	it( 'renders ActivationGate when gate="inactive"', () => {
		render(
			<SocialGate gate="inactive" onDismissPricing={ jest.fn() }>
				<div>tabs</div>
			</SocialGate>
		);
		expect( screen.getByText( 'activation-gate' ) ).toBeInTheDocument();
	} );

	it( 'renders children when gate is null', () => {
		render(
			<SocialGate gate={ null } onDismissPricing={ jest.fn() }>
				<div>tabs</div>
			</SocialGate>
		);
		expect( screen.getByText( 'tabs' ) ).toBeInTheDocument();
	} );
} );
