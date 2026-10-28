import { render, screen } from '@testing-library/react';
import SubscriptionTypeCell from '../_inc/subscribers/components/cells/subscription-type-cell';
import type { Subscriber, SubscriptionPlan } from '../_inc/subscribers/data/types';

// `@wordpress/ui` is stubbed to plain elements so each badge's intent can be asserted.
jest.mock( '@wordpress/ui', () => ( {
	__esModule: true,
	Badge: ( { intent, children }: { intent: string; children: React.ReactNode } ) => (
		<span data-intent={ intent }>{ children }</span>
	),
	Stack: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
} ) );

const subscriberWith = ( plans: SubscriptionPlan[] ): Subscriber => ( {
	user_id: 1,
	display_name: 'Reader',
	email_address: 'reader@example.com',
	subscription_status: 'Subscribed',
	plans,
} );

const comp = ( title: string ): SubscriptionPlan => ( { is_comp: true, title, renewal_price: 0 } );

const paid: SubscriptionPlan = {
	is_comp: false,
	title: 'Gold',
	renew_interval: 'Monthly',
	renewal_price: 5,
	currency: 'USD',
};

describe( 'SubscriptionTypeCell', () => {
	it( 'shows one badge per comp, named after its plan', () => {
		render(
			<SubscriptionTypeCell
				subscriber={ subscriberWith( [ comp( 'Monthly Subscription' ), comp( 'Premium Plan' ) ] ) }
			/>
		);

		expect( screen.getByText( 'Comp: Monthly Subscription' ) ).toHaveAttribute(
			'data-intent',
			'informational'
		);
		expect( screen.getByText( 'Comp: Premium Plan' ) ).toHaveAttribute(
			'data-intent',
			'informational'
		);
	} );

	it( 'shows a comp next to a paid plan', () => {
		render( <SubscriptionTypeCell subscriber={ subscriberWith( [ paid, comp( 'Silver' ) ] ) } /> );

		expect( screen.getByText( /^Monthly/ ) ).toHaveAttribute( 'data-intent', 'stable' );
		expect( screen.getByText( 'Comp: Silver' ) ).toHaveAttribute( 'data-intent', 'informational' );
	} );

	it( 'leaves out expired plans', () => {
		render(
			<SubscriptionTypeCell
				subscriber={ subscriberWith( [ paid, { ...comp( 'Silver' ), status: 'expired' } ] ) }
			/>
		);

		expect( screen.getByText( /^Monthly/ ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Comp: Silver' ) ).not.toBeInTheDocument();
	} );

	it( 'shows Free when there is no paid or comp plan', () => {
		render( <SubscriptionTypeCell subscriber={ subscriberWith( [] ) } /> );

		expect( screen.getByText( 'Free' ) ).toHaveAttribute( 'data-intent', 'none' );
	} );
} );
