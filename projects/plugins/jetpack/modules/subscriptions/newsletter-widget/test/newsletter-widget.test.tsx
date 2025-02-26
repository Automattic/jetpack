import { render, screen } from '@testing-library/react';
import React from 'react';
import { NewsletterWidget } from '../src/newsletter-widget';

describe( 'NewsletterWidget', () => {
	const defaultProps = {
		hostname: 'example.com',
		adminUrl: 'https://example.com/wp-admin/',
	};

	it( 'renders', () => {
		render( <NewsletterWidget { ...defaultProps } /> );
		expect( screen.getByText( 'Quick Links' ) ).toBeInTheDocument();
	} );

	it( 'displays the learn more link with correct href', () => {
		render( <NewsletterWidget { ...defaultProps } /> );
		const learnMoreLink = screen.getByText( 'Learn more' );
		expect( learnMoreLink ).toHaveAttribute(
			'href',
			'https://wordpress.com/learn/courses/newsletters-101/wordpress-com-newsletter/'
		);
	} );

	it( 'renders all quick links with correct hrefs', () => {
		render( <NewsletterWidget { ...defaultProps } /> );

		const expectedLinks = [
			{
				text: 'Publish your next post',
				href: 'https://example.com/wp-admin/edit.php',
			},
			{
				text: 'View subscriber stats',
				href: 'https://wordpress.com/stats/subscribers/example.com',
			},
			{
				text: 'Import subscribers',
				href: 'https://wordpress.com/subscribers/example.com',
			},
			{
				text: 'Manage subscribers',
				href: 'https://wordpress.com/subscribers/example.com',
			},
			{
				text: 'Monetize',
				href: 'https://wordpress.com/earn/example.com',
			},
			{
				text: 'Newsletter settings',
				href: 'https://wordpress.com/settings/newsletter/example.com',
			},
		];

		expectedLinks.forEach( ( { text, href } ) => {
			const link = screen.getByText( text );
			expect( link ).toBeInTheDocument();
			expect( link ).toHaveAttribute( 'href', href );
		} );
	} );
} );
