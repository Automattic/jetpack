import selectors from '../selectors';

const {
	getProtectedOwner,
	isProtectedOwnerRequired,
	hasProtectedOwner,
	isOwnershipLocked,
	getProtectedOwnerStatus,
	isCurrentUserTheProtectedOwner,
} = selectors;

describe( 'protected owner selectors', () => {
	describe( 'when the server withheld the state', () => {
		// The viewer cannot manage the connection, so the server sends null. That is "cannot say",
		// not "no" — a caller that renders a warning on false would show it to a contributor.
		const state = { protectedOwner: null };

		it( 'reports the state as unavailable rather than empty', () => {
			expect( getProtectedOwner( state ) ).toBeNull();
		} );

		it( 'answers false to every question, so nothing renders on a guess', () => {
			expect( isProtectedOwnerRequired( state ) ).toBe( false );
			expect( hasProtectedOwner( state ) ).toBe( false );
			expect( isOwnershipLocked( state ) ).toBe( false );
			expect( isCurrentUserTheProtectedOwner( state ) ).toBe( false );
			expect( getProtectedOwnerStatus( state ) ).toBeNull();
		} );
	} );

	describe( 'when no consumer is asking for an owner', () => {
		const state = { protectedOwner: { required: false } };

		it( 'is distinguishable from the withheld case', () => {
			expect( getProtectedOwner( state ) ).not.toBeNull();
			expect( isProtectedOwnerRequired( state ) ).toBe( false );
		} );

		it( 'has no classified state to report', () => {
			expect( getProtectedOwnerStatus( state ) ).toBeNull();
			expect( hasProtectedOwner( state ) ).toBe( false );
		} );
	} );

	describe( 'when a consumer is asking and the gate is closed', () => {
		const state = {
			protectedOwner: {
				required: true,
				protected: false,
				locked: false,
				status: 'CAN_ESTABLISH',
				isCurrentUserTheOwner: false,
			},
		};

		it( 'reports the requirement and the reason', () => {
			expect( isProtectedOwnerRequired( state ) ).toBe( true );
			expect( hasProtectedOwner( state ) ).toBe( false );
			expect( getProtectedOwnerStatus( state ) ).toBe( 'CAN_ESTABLISH' );
		} );
	} );

	describe( 'when the owner is confirmed', () => {
		const state = {
			protectedOwner: {
				required: true,
				protected: true,
				locked: true,
				status: 'RE_EVALUATE',
				isCurrentUserTheOwner: true,
			},
		};

		it( 'reports the gate open and ownership locked', () => {
			expect( hasProtectedOwner( state ) ).toBe( true );
			expect( isOwnershipLocked( state ) ).toBe( true );
			expect( isCurrentUserTheProtectedOwner( state ) ).toBe( true );
		} );
	} );

	describe( 'with no protected owner key at all', () => {
		// An older server, or script data assembled without it.
		it( 'behaves like the withheld case instead of throwing', () => {
			expect( getProtectedOwner( {} ) ).toBeNull();
			expect( isProtectedOwnerRequired( {} ) ).toBe( false );
			expect( getProtectedOwnerStatus( {} ) ).toBeNull();
		} );
	} );
} );
