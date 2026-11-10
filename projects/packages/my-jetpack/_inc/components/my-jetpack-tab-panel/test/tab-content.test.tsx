import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MY_JETPACK_SECTION_FEATURES, MY_JETPACK_SECTION_OVERVIEW } from '../constants';
import { TabContent } from '../tab-content';

jest.mock( '../features/content', () => ( {
	FeaturesContent: () => jest.requireActual( 'react' ).createElement( 'div', null, 'Features' ),
} ) );
jest.mock( '../overview/content', () => ( {
	OverviewContent: ( { beforeContent } ) =>
		jest.requireActual( 'react' ).createElement( 'section', null, beforeContent ),
} ) );
let mockOverviewV1 = false;
jest.mock( '../../../data/utils/get-my-jetpack-window-state', () => ( {
	getMyJetpackWindowInitialState: () => ( { overviewV1: mockOverviewV1 } ),
} ) );
jest.mock( '../overview/footer', () => ( {
	OverviewFooter: () =>
		jest.requireActual( 'react' ).createElement( 'div', null, 'Plan and Connection' ),
} ) );
let mockHeaderControls = false;
jest.mock( '../../header-controls/slot', () => ( {
	isHeaderControlsEnabled: () => mockHeaderControls,
} ) );
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

	it.each( [ false, true ] )(
		'with Overview v1 on: %s, leaves the notices to the Overview only when on',
		overviewV1 => {
			mockOverviewV1 = overviewV1;
			render(
				<TabContent name={ MY_JETPACK_SECTION_OVERVIEW } beforeContent={ <div>Notice</div> } />
			);

			// eslint-disable-next-line testing-library/no-node-access -- The Overview content has no role or text to query by.
			expect( screen.getByText( 'Notice' ).closest( 'section' ) !== null ).toBe( overviewV1 );
		}
	);

	it.each( [
		[ false, 1 ],
		[ true, 0 ],
	] )(
		'with the header controls on: %s, shows the Plan and Connection band %d times',
		( headerControls, count ) => {
			mockHeaderControls = headerControls;
			render( <TabContent name={ MY_JETPACK_SECTION_OVERVIEW } /> );

			expect( screen.queryAllByText( 'Plan and Connection' ) ).toHaveLength( count );
		}
	);
} );
