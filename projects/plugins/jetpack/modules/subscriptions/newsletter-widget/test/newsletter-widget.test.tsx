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

jest.mock( '@wordpress/ui', () => ( {
	Link: jest.fn( ( { href, children } ) => <a href={ href }>{ children }</a> ),
} ) );

jest.mock( '@wordpress/icons', () => ( {
	envelope: 'envelope-icon-mock',
	payment: 'payment-icon-mock',
} ) );

describe( 'NewsletterWidget', () => {
	const defaultProps: NewsletterWidgetProps = {
		site: 'example.com',
		adminUrl: 'https://example.com/wp-admin/',
		isWpcomSite: true,
		isStatsModuleActive: true,
		emailSubscribers: 100,
		allSubscribers: 150,
		paidSubscribers: 50,
		subscriberTotalsByDate: {
			'2021-01-01': {
				all: 10,
				paid: 5,
			},
		},
		showHeader: true,
		showChart: true,
		newsletterSettingsUrl: 'https://wordpress.com/settings/newsletter/example.com',
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

		// Check for chart label
		expect( screen.getByText( 'Total Subscribers' ) ).toBeInTheDocument();
	} );

	it( 'renders correct quick links when hosted on WordPress.com', () => {
		const redirectDomain = 'wordpress.com';
		const newsletterUrl = 'https://wordpress.com/settings/newsletter/example.com';
		render( <NewsletterWidget { ...defaultProps } newsletterSettingsUrl={ newsletterUrl } /> );

		const expectedLinks = [
			{
				text: 'Learn more',
				href: 'https://wordpress.com/learn/courses/newsletters-101/wordpress-com-newsletter',
			},
			{
				text: 'Publish your next post',
				href: 'https://example.com/wp-admin/post-new.php',
			},
			{
				text: 'View subscriber stats',
				href: 'https://example.com/wp-admin/admin.php?page=stats#!/stats/subscribers/example.com',
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
				href: newsletterUrl,
			},
		];

		expectedLinks.forEach( ( { text, href } ) => {
			const link = screen.getByText( text );
			expect( link ).toBeInTheDocument();
			expect( link ).toHaveAttribute( 'href', href );
		} );
	} );

	it( 'renders correct quick links when self-hosted (and stats module is active)', () => {
		const redirectDomain = 'cloud.jetpack.com';
		const selfHostedNewsletterUrl = `https://${ defaultProps.site }/wp-admin/admin.php?page=jetpack#/newsletter`;
		render(
			<NewsletterWidget
				{ ...defaultProps }
				isWpcomSite={ false }
				isStatsModuleActive={ true }
				newsletterSettingsUrl={ selfHostedNewsletterUrl }
			/>
		);

		const expectedLinks = [
			{
				text: 'Learn more',
				href: `https://jetpack.com/support/newsletter`,
			},
			{
				text: 'Publish your next post',
				href: `https://${ defaultProps.site }/wp-admin/post-new.php`,
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
				href: selfHostedNewsletterUrl,
			},
		];

		expectedLinks.forEach( ( { text, href } ) => {
			const link = screen.getByText( text );
			expect( link ).toBeInTheDocument();
			expect( link ).toHaveAttribute( 'href', href );
		} );
	} );

	it( 'renders newsletter settings link with provided URL', () => {
		const customNewsletterUrl = 'https://example.com/wp-admin/admin.php?page=jetpack-newsletter';
		render(
			<NewsletterWidget { ...defaultProps } newsletterSettingsUrl={ customNewsletterUrl } />
		);

		const link = screen.getByText( 'Newsletter settings' );
		expect( link ).toHaveAttribute( 'href', customNewsletterUrl );
	} );

	it( 'does not render newsletter settings link when URL is not provided', () => {
		render( <NewsletterWidget { ...defaultProps } newsletterSettingsUrl={ undefined } /> );

		expect( screen.queryByText( 'Newsletter settings' ) ).not.toBeInTheDocument();
	} );

	describe( 'Stats display conditions', () => {
		it( 'hides stats when showHeader = false', () => {
			render( <NewsletterWidget { ...defaultProps } showHeader={ false } /> );

			expect( screen.queryByText( /subscribers \(\d+ via email\)/ ) ).not.toBeInTheDocument();

			expect( screen.queryByText( /paid subscribers/ ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'Chart display conditions', () => {
		it( 'hides chart when showChart = false', () => {
			const props: NewsletterWidgetProps = {
				...defaultProps,
				showChart: false,
			};

			render( <NewsletterWidget { ...props } /> );
			expect( screen.queryByText( 'Total Subscribers' ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'Stats module inactive behavior', () => {
		it( 'hides subscriber stats link when stats module is inactive', () => {
			render( <NewsletterWidget { ...defaultProps } isStatsModuleActive={ false } /> );

			expect( screen.queryByText( 'View subscriber stats' ) ).not.toBeInTheDocument();
		} );
	} );
} );
