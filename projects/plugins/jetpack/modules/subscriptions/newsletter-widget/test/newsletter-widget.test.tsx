import { getRedirectUrl } from '@automattic/jetpack-components';
import { render, screen } from '@testing-library/react';
import { NewsletterWidget, NewsletterWidgetProps } from '../src/components/newsletter-widget';

jest.mock( '@wordpress/components', () => {
	const actualModule = jest.requireActual( '@wordpress/components' );
	const mockModule = {
		Icon: jest.fn( () => null ),
	};

	return new Proxy( actualModule, {
		get: ( target, property ) => mockModule[ property ] ?? target[ property ],
	} );
} );

jest.mock( '@wordpress/icons', () => ( {
	envelope: 'envelope-icon-mock',
	payment: 'payment-icon-mock',
} ) );

describe( 'NewsletterWidget', () => {
	const defaultProps: NewsletterWidgetProps = {
		site: 'example.com',
		adminUrl: 'https://example.com/wp-admin/',
		isWpcomSite: true,
		emailSubscribers: 100,
		allSubscribers: 150,
		paidSubscribers: 50,
		subscriberTotalsByDate: {
			'2021-01-01': {
				all: 10,
				paid: 5,
			},
		},
	};

	it( 'renders', () => {
		render( <NewsletterWidget { ...defaultProps } /> );
		expect( screen.getByText( 'Quick Links' ) ).toBeInTheDocument();

		// Check for subscriptions label
		expect(
			screen.getByText(
				`${ defaultProps.allSubscribers } subscribers (${ defaultProps.emailSubscribers } via email)`
			)
		).toBeInTheDocument();

		// Check for paid subscriptions label
		expect(
			screen.getByText( `${ defaultProps.paidSubscribers } paid subscribers` )
		).toBeInTheDocument();
	} );

	it( 'displays the learn more link with correct href', () => {
		render( <NewsletterWidget { ...defaultProps } /> );
		const learnMoreLink = screen.getByText( 'Learn more' );
		expect( learnMoreLink ).toHaveAttribute(
			'href',
			getRedirectUrl(
				'https://wordpress.com/learn/courses/newsletters-101/wordpress-com-newsletter'
			)
		);
	} );

	it( 'renders correct quick links when hosted on WordPress.com', () => {
		const redirectDomain = 'wordpress.com';
		render( <NewsletterWidget { ...defaultProps } /> );

		const expectedLinks = [
			{
				text: 'Publish your next post',
				href: 'https://example.com/wp-admin/edit.php',
			},
			{
				text: 'View subscriber stats',
				href: getRedirectUrl(
					`https://${ redirectDomain }/stats/subscribers/${ defaultProps.site }`
				),
			},
			{
				text: 'Import subscribers',
				href: getRedirectUrl( `https://${ redirectDomain }/subscribers/${ defaultProps.site }`, {
					anchor: 'add-subscribers',
				} ),
			},
			{
				text: 'Manage subscribers',
				href: getRedirectUrl( `https://${ redirectDomain }/subscribers/${ defaultProps.site }` ),
			},
			{
				text: 'Monetize',
				href: getRedirectUrl( `https://${ redirectDomain }/earn/${ defaultProps.site }` ),
			},
			{
				text: 'Newsletter settings',
				href: getRedirectUrl(
					`https://${ redirectDomain }/settings/newsletter/${ defaultProps.site }`
				),
			},
		];

		expectedLinks.forEach( ( { text, href } ) => {
			const link = screen.getByText( text );
			expect( link ).toBeInTheDocument();
			expect( link ).toHaveAttribute( 'href', href );
		} );
	} );

	it( 'renders correct quick links when self-hosted', () => {
		const redirectDomain = 'cloud.jetpack.com';
		render( <NewsletterWidget { ...defaultProps } isWpcomSite={ false } /> );

		const expectedLinks = [
			{
				text: 'Publish your next post',
				href: `https://${ defaultProps.site }/wp-admin/edit.php`,
			},
			{
				text: 'View subscriber stats',
				href: `https://${ defaultProps.site }/wp-admin/admin.php?page=stats#!/stats/subscribers/${ defaultProps.site }`,
			},
			{
				text: 'Import subscribers',
				href: getRedirectUrl( `https://${ redirectDomain }/subscribers/${ defaultProps.site }`, {
					anchor: 'add-subscribers',
				} ),
			},
			{
				text: 'Manage subscribers',
				href: getRedirectUrl( `https://${ redirectDomain }/subscribers/${ defaultProps.site }` ),
			},
			{
				text: 'Monetize',
				href: getRedirectUrl( `https://${ redirectDomain }/monetize/${ defaultProps.site }` ),
			},
			{
				text: 'Newsletter settings',
				href: `https://${ defaultProps.site }/wp-admin/admin.php?page=jetpack#newsletter`,
			},
		];

		expectedLinks.forEach( ( { text, href } ) => {
			const link = screen.getByText( text );
			expect( link ).toBeInTheDocument();
			expect( link ).toHaveAttribute( 'href', href );
		} );
	} );

	describe( 'Stats display conditions', () => {
		it( 'shows stats section when allSubscribers > 0', () => {
			render(
				<NewsletterWidget
					{ ...defaultProps }
					allSubscribers={ 10 }
					emailSubscribers={ 0 }
					paidSubscribers={ 0 }
				/>
			);

			expect( screen.getByText( '10 subscribers (0 via email)' ) ).toBeInTheDocument();
		} );

		it( 'shows stats section when paidSubscribers > 0', () => {
			render( <NewsletterWidget { ...defaultProps } allSubscribers={ 0 } paidSubscribers={ 5 } /> );

			expect( screen.getByText( '5 paid subscribers' ) ).toBeInTheDocument();
		} );

		it( 'hides stats section when allSubscribers and paidSubscribers are 0', () => {
			render(
				<NewsletterWidget
					{ ...defaultProps }
					allSubscribers={ 0 }
					emailSubscribers={ 0 }
					paidSubscribers={ 0 }
				/>
			);

			expect( screen.queryByText( /subscribers \(\d+ via email\)/ ) ).not.toBeInTheDocument();

			expect( screen.queryByText( /paid subscribers/ ) ).not.toBeInTheDocument();
		} );

		it( 'shows stats section when allSubscribers = 1', () => {
			render(
				<NewsletterWidget
					{ ...defaultProps }
					allSubscribers={ 1 }
					emailSubscribers={ 1 }
					paidSubscribers={ 0 }
				/>
			);

			expect( screen.getByText( '1 subscriber (1 via email)' ) ).toBeInTheDocument();
			expect( screen.getByText( '0 paid subscribers' ) ).toBeInTheDocument();
		} );

		it( 'shows stats section when paidSubscribers = 1', () => {
			render(
				<NewsletterWidget
					{ ...defaultProps }
					allSubscribers={ 10 }
					emailSubscribers={ 7 }
					paidSubscribers={ 1 }
				/>
			);

			expect( screen.getByText( '10 subscribers (7 via email)' ) ).toBeInTheDocument();
			expect( screen.getByText( '1 paid subscriber' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Chart display conditions', () => {
		it( 'shows chart when at least one day has a total "all" count >= 5', () => {
			const props: NewsletterWidgetProps = {
				...defaultProps,
				subscriberTotalsByDate: {
					'2021-01-01': { all: 5, paid: 0 },
				},
			};

			render( <NewsletterWidget { ...props } /> );
			expect( screen.getByText( 'Total Subscribers' ) ).toBeInTheDocument();
		} );

		it( 'shows chart when at least one day has a total "paid" > 0', () => {
			const props: NewsletterWidgetProps = {
				...defaultProps,
				subscriberTotalsByDate: {
					'2021-01-01': { all: 0, paid: 1 },
				},
			};

			render( <NewsletterWidget { ...props } /> );
			expect( screen.getByText( 'Total Subscribers' ) ).toBeInTheDocument();
		} );

		it( 'hides chart when no day has "all" count >= 5 or "paid" count > 0', () => {
			const props: NewsletterWidgetProps = {
				...defaultProps,
				subscriberTotalsByDate: {
					'2021-01-01': { all: 4, paid: 0 },
					'2021-01-02': { all: 3, paid: 0 },
				},
			};

			render( <NewsletterWidget { ...props } /> );
			expect( screen.queryByText( 'Total Subscribers' ) ).not.toBeInTheDocument();
		} );

		it( 'handles empty subscriberTotalsByDate by hiding chart', () => {
			const props = {
				...defaultProps,
				subscriberTotalsByDate: {},
			};

			render( <NewsletterWidget { ...props } /> );
			expect( screen.queryByText( 'Total Subscribers' ) ).not.toBeInTheDocument();
		} );
	} );
} );
