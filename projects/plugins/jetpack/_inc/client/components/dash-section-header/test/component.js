import { getRedirectUrl } from '@automattic/jetpack-components';
import React from 'react';
import { render, screen } from 'test/test-utils';
import { DashSectionHeader } from '../index';

describe( 'DashSectionHeader', () => {
	const testProps = {
		label: 'Site Stats',
		settingsPath: '',
		externalLinkPath: '',
		externalLink: '',
		siteRawUrl: 'https://example.org/',
	};

	it( 'is correctly rendered', () => {
		const { container } = render( <DashSectionHeader { ...testProps } /> );
		// eslint-disable-next-line testing-library/no-container
		expect( container.querySelector( '.jp-dash-section-header' ) ).toBeInTheDocument();
	} );

	it( 'has the right title', () => {
		render( <DashSectionHeader { ...testProps } /> );
		expect( screen.getByRole( 'heading', { level: 2, name: 'Site Stats' } ) ).toBeInTheDocument();
	} );

	it( 'does not display a linked icon for Site Stats', () => {
		const { container } = render( <DashSectionHeader { ...testProps } /> );
		// eslint-disable-next-line testing-library/no-container
		expect( container.querySelector( '.gridicon' ) ).not.toBeInTheDocument();
		expect(
			// eslint-disable-next-line testing-library/no-container
			container.querySelector( 'a.jp-dash-section-header__settings' )
		).not.toBeInTheDocument();
	} );

	it( 'does not display a external link if one is not supplied', () => {
		render( <DashSectionHeader { ...testProps } /> );
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );

	describe( 'renders additional elements when settings path and external links are supplied', () => {
		const externalPath = getRedirectUrl( 'calypso-settings-security', {
			site: testProps.siteRawUrl,
		} );
		const currentTestProps = {
			...testProps,
			settingsPath: '#security',
			externalLinkPath: externalPath,
			externalLink: 'External',
		};

		it( 'there is an external link', () => {
			render( <DashSectionHeader { ...currentTestProps } /> );
			expect( screen.getByRole( 'link', { name: 'External' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'link', { name: 'External' } ) ).toHaveAttribute(
				'href',
				externalPath
			);
		} );
	} );
} );
