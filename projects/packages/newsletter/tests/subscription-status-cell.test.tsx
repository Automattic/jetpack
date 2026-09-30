// Imports must come after the jest.mock factories above.
import { render, screen } from '@testing-library/react';
import SubscriptionStatusCell from '../_inc/subscribers/components/cells/subscription-status-cell';

// `@wordpress/ui` is stubbed to plain elements so the badge intent and tooltip parts can be asserted.
jest.mock( '@wordpress/ui', () => ( {
	__esModule: true,
	Badge: ( { intent, children }: { intent: string; children: React.ReactNode } ) => (
		<span data-intent={ intent }>{ children }</span>
	),
	Tooltip: {
		Root: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
		Trigger: ( { children, ...props }: { children: React.ReactNode } ) => (
			<button { ...props }>{ children }</button>
		),
		Popup: ( { children }: { children: React.ReactNode } ) => (
			<div role="tooltip">{ children }</div>
		),
	},
} ) );

describe( 'SubscriptionStatusCell', () => {
	it( 'renders a plain badge for statuses without a reason', () => {
		render( <SubscriptionStatusCell status="Subscribed" reason={ null } /> );

		expect( screen.getByText( 'Subscribed' ) ).toHaveAttribute( 'data-intent', 'stable' );
		expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'tooltip' ) ).not.toBeInTheDocument();
	} );

	it( 'keeps the plain "Not sending" badge when no reason is given', () => {
		render( <SubscriptionStatusCell status="Not sending" /> );

		expect( screen.getByText( 'Not sending' ) ).toHaveAttribute( 'data-intent', 'high' );
		expect( screen.queryByRole( 'tooltip' ) ).not.toBeInTheDocument();
	} );

	it.each( [
		[ 'bounced', 'Bounced', /couldn't be delivered/ ],
		[ 'emails_paused', 'Emails paused', /turned off all WordPress\.com emails/ ],
	] as const )(
		'labels a "%s" subscriber and explains why in a tooltip',
		( reason, badgeLabel, description ) => {
			render( <SubscriptionStatusCell status="Not sending" reason={ reason } /> );

			expect( screen.getByText( badgeLabel ) ).toHaveAttribute( 'data-intent', 'high' );
			expect( screen.queryByText( 'Not sending' ) ).not.toBeInTheDocument();
			expect( screen.getByRole( 'tooltip' ) ).toHaveTextContent( description );

			// The trigger is keyboard-reachable and announces both the label and the explanation.
			const trigger = screen.getByRole( 'button' );
			expect( trigger ).toHaveAccessibleName( expect.stringContaining( badgeLabel ) );
			expect( trigger ).toHaveAccessibleName( expect.stringMatching( description ) );
		}
	);
} );
