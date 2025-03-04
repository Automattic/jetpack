import { getRedirectUrl } from '@automattic/jetpack-components';
import { render, screen } from '@testing-library/react';
import { NewsletterWidget } from '../src/newsletter-widget';

// Add these mock declarations at the top of the file, before the tests
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
	const defaultProps = {
		site: 'example.com',
		adminUrl: 'https://example.com/wp-admin/',
		isWpcomSite: true,
		emailSubscribers: 100,
		paidSubscribers: 50,
	};

	it( 'renders', () => {
		render( <NewsletterWidget { ...defaultProps } /> );
		expect( screen.getByText( 'Quick Links' ) ).toBeInTheDocument();
		expect( screen.getByText( defaultProps.emailSubscribers ) ).toBeInTheDocument();

		// Check for paid subscribers number
		expect( screen.getByText( defaultProps.paidSubscribers ) ).toBeInTheDocument();

		// Check for email subscriptions label
		expect( screen.getByText( 'email subscriptions' ) ).toBeInTheDocument();

		// Check for paid subscriptions label
		expect( screen.getByText( 'paid subscriptions' ) ).toBeInTheDocument();
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
				href: getRedirectUrl( `https://${ redirectDomain }/subscribers/${ defaultProps.site }` ),
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
				href: getRedirectUrl( `https://${ redirectDomain }/subscribers/${ defaultProps.site }` ),
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
} );
