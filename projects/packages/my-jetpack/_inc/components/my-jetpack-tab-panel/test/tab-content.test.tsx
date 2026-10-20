import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MY_JETPACK_SECTION_FEATURES } from '../constants';
import { TabContent } from '../tab-content';

jest.mock( '../features/content', () => ( {
	FeaturesContent: () => jest.requireActual( 'react' ).createElement( 'div', null, 'Features' ),
} ) );
jest.mock( '../overview/content', () => ( { OverviewContent: () => null } ) );
jest.mock( '../overview/footer', () => ( { OverviewFooter: () => null } ) );
jest.mock( '../help/content', () => ( { HelpContent: () => null } ) );
jest.mock( '../help/footer', () => ( { HelpFooter: () => null } ) );

describe( 'TabContent', () => {
	it( 'renders the notices above the section, inside its padded wrapper', () => {
		render(
			<TabContent name={ MY_JETPACK_SECTION_FEATURES } beforeContent={ <div>Notice</div> } />
		);

		const notice = screen.getByText( 'Notice' );
		const section = screen.getByText( 'Features' );
		// eslint-disable-next-line testing-library/no-node-access -- The padded wrapper has no role or text to query by.
		expect( notice.parentElement ).toBe( section.parentElement );
		expect( notice.compareDocumentPosition( section ) ).toBe( Node.DOCUMENT_POSITION_FOLLOWING );
	} );
} );
