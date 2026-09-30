import { getAccessDescription, getNewsletterOverviewText } from '../newsletter-copy';

describe( 'getAccessDescription', () => {
	test( 'describes open access for everybody', () => {
		expect( getAccessDescription( 'everybody' ) ).toBe( 'Anyone can read it on your site.' );
	} );

	test( 'describes the subscriber preview for subscribers', () => {
		expect( getAccessDescription( 'subscribers' ) ).toBe(
			'Only subscribers can read it on your site. Others see a preview and can subscribe.'
		);
	} );

	test( 'describes the paid preview for paid subscribers', () => {
		expect( getAccessDescription( 'paid_subscribers' ) ).toBe(
			'Only paid subscribers can read it on your site. Others see a preview and can subscribe or upgrade.'
		);
	} );

	test( 'names the tier when a paid post is limited to one', () => {
		expect( getAccessDescription( 'paid_subscribers', false, 'Plus' ) ).toBe(
			'Only subscribers on your ‘Plus’ tier can read it on your site.'
		);
	} );

	test( 'splits access at the paywall when one is present', () => {
		expect( getAccessDescription( 'subscribers', true ) ).toBe(
			'Anyone can read it up to your paywall. Only subscribers can read the rest.'
		);
		expect( getAccessDescription( 'paid_subscribers', true, 'Plus' ) ).toBe(
			'Anyone can read it up to your paywall. Only paid subscribers can read the rest.'
		);
	} );

	test( 'falls back to the open description for an unknown access level', () => {
		expect( getAccessDescription( undefined ) ).toBe( 'Anyone can read it on your site.' );
	} );
} );

describe( 'getNewsletterOverviewText', () => {
	const settings = {
		accessLevel: 'everybody',
		isEmailEnabled: true,
		isPasswordProtected: false,
		hasPaywall: false,
		tierName: null,
		categoryNames: [],
	};

	test( 'says the post won’t be emailed when email is off, and who can still read it', () => {
		expect(
			getNewsletterOverviewText( {
				...settings,
				accessLevel: 'subscribers',
				isEmailEnabled: false,
			} )
		).toEqual( {
			main: 'This post won’t be emailed.',
			details: [
				'Only subscribers can read it on your site. Others see a preview and can subscribe.',
			],
			isEmailOff: true,
		} );
	} );

	test( 'emails every subscriber for public and subscriber-only posts', () => {
		expect( getNewsletterOverviewText( settings ).main ).toBe(
			'This post is emailed to all subscribers.'
		);
		expect( getNewsletterOverviewText( { ...settings, accessLevel: 'subscribers' } ).main ).toBe(
			'This post is emailed to all subscribers.'
		);
	} );

	test( 'emails only paid subscribers for a paid post', () => {
		expect(
			getNewsletterOverviewText( { ...settings, accessLevel: 'paid_subscribers' } ).main
		).toBe( 'Only your paid subscribers are emailed this post.' );
	} );

	// A paywall lifts the paid-only email filter, so free subscribers get the part above it.
	test( 'emails every subscriber for a paid post with a paywall', () => {
		expect(
			getNewsletterOverviewText( {
				...settings,
				accessLevel: 'paid_subscribers',
				hasPaywall: true,
				tierName: 'Plus',
			} )
		).toEqual( {
			main: 'This post is emailed to all subscribers. Free subscribers get it up to your paywall.',
			details: [
				'Anyone can read it up to your paywall. Only paid subscribers can read the rest.',
			],
		} );
	} );

	test( 'names the tier a paid post is limited to', () => {
		expect(
			getNewsletterOverviewText( {
				...settings,
				accessLevel: 'paid_subscribers',
				tierName: 'Plus',
			} ).main
		).toBe( 'Only subscribers on your ‘Plus’ tier are emailed this post.' );
	} );

	test( 'narrows the email to the chosen categories, plus All content subscribers', () => {
		expect(
			getNewsletterOverviewText( {
				...settings,
				accessLevel: 'subscribers',
				categoryNames: [ 'Movies' ],
			} )
		).toEqual( {
			main: 'This post is emailed to subscribers who chose these newsletter categories.',
			categoryNames: [ 'Movies' ],
			details: [
				'Plus subscribers who chose ‘All content’.',
				'Only subscribers can read it on your site. Others see a preview and can subscribe.',
			],
		} );
	} );

	test( 'keeps paid wording for a paid post with categories', () => {
		const { main, details } = getNewsletterOverviewText( {
			...settings,
			accessLevel: 'paid_subscribers',
			categoryNames: [ 'Movies' ],
		} );

		expect( main ).toBe(
			'This post is emailed to paid subscribers who chose these newsletter categories.'
		);
		expect( details[ 0 ] ).toBe( 'Plus paid subscribers who chose ‘All content’.' );
	} );

	test.each( [ false, true ] )(
		'keeps category and All content audiences on the named tier (password protected: %s)',
		isPasswordProtected => {
			expect(
				getNewsletterOverviewText( {
					...settings,
					accessLevel: 'paid_subscribers',
					tierName: 'Plus',
					categoryNames: [ 'Movies' ],
					isPasswordProtected,
				} )
			).toEqual( {
				main: 'This post is emailed to subscribers on your ‘Plus’ tier who chose these newsletter categories.',
				categoryNames: [ 'Movies' ],
				details: [
					'Plus subscribers on your ‘Plus’ tier who chose ‘All content’.',
					isPasswordProtected
						? 'The post stays password protected on your site. Only people with the password can read it there.'
						: 'Only subscribers on your ‘Plus’ tier can read it on your site.',
				],
			} );
		}
	);

	test( 'includes free subscribers in category and All content audiences when a paid tier has a paywall', () => {
		expect(
			getNewsletterOverviewText( {
				...settings,
				accessLevel: 'paid_subscribers',
				tierName: 'Plus',
				hasPaywall: true,
				categoryNames: [ 'Movies' ],
			} )
		).toEqual( {
			main: 'This post is emailed to subscribers who chose these newsletter categories.',
			categoryNames: [ 'Movies' ],
			details: [
				'Plus subscribers who chose ‘All content’.',
				'Anyone can read it up to your paywall. Only paid subscribers can read the rest.',
			],
		} );
	} );

	// Password protection changes what the email contains, not who receives it.
	test( 'keeps the audience of a password-protected post and explains the password', () => {
		expect(
			getNewsletterOverviewText( {
				...settings,
				accessLevel: 'paid_subscribers',
				isPasswordProtected: true,
			} )
		).toEqual( {
			main: 'Only your paid subscribers are emailed this post.',
			details: [
				'The post stays password protected on your site. Only people with the password can read it there.',
			],
		} );
	} );

	test( 'treats an unknown access level as public', () => {
		expect( getNewsletterOverviewText( { ...settings, accessLevel: undefined } ).details ).toEqual(
			[ 'Anyone can read it on your site.' ]
		);
	} );
} );
