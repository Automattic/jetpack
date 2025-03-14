import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SiteVisibility from '../index';

describe( 'SiteVisibility', () => {
	const baseProps = {
		homeUrl: 'https://example.com',
		isWpcomStagingSite: false,
		isUnlaunchedSite: false,
		hasSitePreviewLink: false,
		sitePreviewLinkNonce: 'test-nonce',
	};

	it( 'checks Coming Soon when appropriate props are provided', () => {
		const props = {
			...baseProps,
			blogPublic: 0,
			wpcomComingSoon: 0,
			wpcomPublicComingSoon: 1,
			wpcomDataSharingOptOut: false,
		};

		render( <SiteVisibility { ...props } /> );

		expect( screen.getByLabelText( 'Coming Soon' ) ).toBeChecked();
	} );

	it( 'checks Public (default state) when appropriate props are provided', () => {
		const props = {
			...baseProps,
			blogPublic: 1,
			wpcomComingSoon: 0,
			wpcomPublicComingSoon: 0,
			wpcomDataSharingOptOut: false,
		};

		render( <SiteVisibility { ...props } /> );

		expect( screen.getByLabelText( 'Public' ) ).toBeChecked();
		expect( screen.getByLabelText( /Discourage search engines/ ) ).not.toBeChecked();
		expect( screen.getByLabelText( /Prevent third-party sharing/ ) ).not.toBeChecked();
	} );

	it( 'checks Public with discourage search engines when appropriate props are provided', () => {
		const props = {
			...baseProps,
			blogPublic: 0,
			wpcomComingSoon: 0,
			wpcomPublicComingSoon: 0,
			wpcomDataSharingOptOut: true,
		};

		render( <SiteVisibility { ...props } /> );

		expect( screen.getByLabelText( 'Public' ) ).toBeChecked();
		expect( screen.getByLabelText( /Discourage search engines/ ) ).toBeChecked();
		expect( screen.getByLabelText( /Prevent third-party sharing/ ) ).toBeDisabled();
	} );

	it( 'checks Public with prevent third-party sharing when appropriate props are provided', () => {
		const props = {
			...baseProps,
			blogPublic: 1,
			wpcomComingSoon: 0,
			wpcomPublicComingSoon: 0,
			wpcomDataSharingOptOut: true,
		};

		render( <SiteVisibility { ...props } /> );

		expect( screen.getByLabelText( 'Public' ) ).toBeChecked();
		expect( screen.getByLabelText( /Discourage search engines/ ) ).not.toBeChecked();
		expect( screen.getByLabelText( /Prevent third-party sharing/ ) ).toBeChecked();
	} );

	it( 'checks Private when appropriate props are provided', () => {
		const props = {
			...baseProps,
			blogPublic: -1,
			wpcomComingSoon: 0,
			wpcomPublicComingSoon: 0,
			wpcomDataSharingOptOut: false,
		};

		render( <SiteVisibility { ...props } /> );

		expect( screen.getByLabelText( 'Private' ) ).toBeChecked();
	} );
} );
