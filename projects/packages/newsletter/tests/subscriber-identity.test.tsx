// The identity cell renders the shared Gravatar next to the subscriber name.
// For subscribers with no real Gravatar, the `d=initials` fallback needs the
// display name (sent as `&name=`) to compute the initials — otherwise the row
// shows a generic placeholder that doesn't match the detail view's initials
// tile. `@wordpress/ui` is stubbed to plain elements; the real Gravatar renders
// so we can assert the generated `<img>` URL.
jest.mock( '@wordpress/ui', () => ( {
	__esModule: true,
	Stack: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
	Text: ( { children }: { children: React.ReactNode } ) => <span>{ children }</span>,
} ) );

// Imports must come after the jest.mock factories above.
import { render, screen } from '@testing-library/react';
import SubscriberIdentity from '../_inc/subscribers/components/cells/subscriber-identity';
import type { Subscriber } from '../_inc/subscribers/data/types';

const subscriber: Subscriber = {
	user_id: 1,
	display_name: 'henridevtest',
	email_address: 'henridevtest@example.com',
	subscription_status: 'subscribed',
};

describe( 'SubscriberIdentity (avatar fallback)', () => {
	it( 'passes the display name to the Gravatar so the initials fallback matches the detail view', () => {
		render( <SubscriberIdentity subscriber={ subscriber } /> );

		// The avatar lives inside an `aria-hidden` wrapper, so include hidden
		// elements when querying for it.
		const img = screen.getByRole( 'img', { hidden: true } ) as HTMLImageElement;

		const url = new URL( img.src );
		expect( url.searchParams.get( 'd' ) ).toBe( 'initials' );
		expect( url.searchParams.get( 'name' ) ).toBe( 'henridevtest' );
	} );
} );
