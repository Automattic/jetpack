/**
 * External dependencies
 */
import { SectionTabs } from '@jetpack-premium-analytics/ui';
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { DetailPageTabPanel } from '../detail-page-tabs';

// The panel carries the same band class as `DetailPageSection`; the shared
// style stub would leave it undefined.
jest.mock( '../detail-page-layout.module.scss', () => ( { section: 'section' } ) );

describe( 'DetailPageTabPanel', () => {
	it( 'mounts a tabbed page section as the active tab panel', () => {
		render(
			<SectionTabs
				tabs={ [
					{ id: 'traffic', label: 'Traffic' },
					{ id: 'email-opens', label: 'Email opens' },
				] }
				value="traffic"
				onChange={ () => {} }
			>
				<DetailPageTabPanel value="traffic">traffic widgets</DetailPageTabPanel>
				<DetailPageTabPanel value="email-opens">email widgets</DetailPageTabPanel>
			</SectionTabs>
		);

		expect( screen.getByRole( 'tabpanel' ) ).toHaveTextContent( 'traffic widgets' );
		expect( screen.getByRole( 'tabpanel' ) ).toHaveClass( 'section' );
	} );

	it( 'keeps the caller class beside the band class', () => {
		render(
			<SectionTabs
				tabs={ [ { id: 'traffic', label: 'Traffic' } ] }
				value="traffic"
				onChange={ () => {} }
			>
				<DetailPageTabPanel value="traffic" className="custom-band">
					traffic widgets
				</DetailPageTabPanel>
			</SectionTabs>
		);

		expect( screen.getByRole( 'tabpanel' ) ).toHaveClass( 'section', 'custom-band' );
	} );
} );
