import { hasNoSubscribersOtherThanOwner } from '../_inc/subscribers/lib/subscriber-helpers';

describe( 'hasNoSubscribersOtherThanOwner', () => {
	it( 'is true when there are no subscribers at all', () => {
		expect( hasNoSubscribersOtherThanOwner( 0, false ) ).toBe( true );
		// Owner flag is irrelevant when the total is zero.
		expect( hasNoSubscribersOtherThanOwner( 0, true ) ).toBe( true );
	} );

	it( 'is true when the only subscriber is the site owner', () => {
		expect( hasNoSubscribersOtherThanOwner( 1, true ) ).toBe( true );
	} );

	it( 'is false when the single subscriber is not the owner', () => {
		expect( hasNoSubscribersOtherThanOwner( 1, false ) ).toBe( false );
	} );

	it( 'is false once there is more than one subscriber, owner included', () => {
		expect( hasNoSubscribersOtherThanOwner( 2, true ) ).toBe( false );
		expect( hasNoSubscribersOtherThanOwner( 5, false ) ).toBe( false );
	} );
} );
