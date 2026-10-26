import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { OverviewContent } from '../content';

jest.mock( '../../../../data/use-site-purchases', () => jest.fn() );
let mockFirstName = '';
jest.mock( '../../../../data/utils/get-my-jetpack-window-state', () => ( {
	getMyJetpackWindowInitialState: ( key?: string ) =>
		key ? { overviewV1: true } : { userFirstName: mockFirstName },
} ) );
jest.mock( '../../../header-controls/slot', () => ( { isHeaderControlsEnabled: () => false } ) );
jest.mock( '../../../overview-blog-posts', () => () => null );
jest.mock( '../../../product-cards-section', () => () => null );
jest.mock( '../../../product-cards-section/overview-sections', () => () => null );
jest.mock( '../../../seo-opt-in-card', () => () => null );
jest.mock( '../a4a-upsell', () => ( { A4AUpsell: () => null } ) );

describe( 'OverviewContent', () => {
	it.each( [
		[ 'Ada', 'Admin', 'Welcome to Jetpack, Ada!' ],
		[ '', 'Admin', 'Welcome to Jetpack, Admin!' ],
		[ '', 'Tom &amp; Jerry', 'Welcome to Jetpack, Tom & Jerry!' ],
		[ '', '', 'Welcome to Jetpack' ],
	] )(
		'with first name "%s" and display name "%s", reads "%s"',
		( firstName, displayName, heading ) => {
			mockFirstName = firstName;
			window.JetpackScriptData = {
				user: { current_user: { display_name: displayName, capabilities: {} } },
			} as typeof window.JetpackScriptData;
			render( <OverviewContent /> );

			expect( screen.getByRole( 'heading', { level: 2, name: heading } ) ).toBeInTheDocument();
		}
	);
} );
