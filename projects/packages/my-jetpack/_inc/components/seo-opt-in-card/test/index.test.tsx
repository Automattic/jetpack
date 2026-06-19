import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import useSeoOptIn from '../../../data/use-seo-opt-in';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import useAnalytics from '../../../hooks/use-analytics';
import SeoOptInCard from '../index';

jest.mock( '../../../data/use-seo-opt-in' );
jest.mock( '../../../data/utils/get-my-jetpack-window-state' );
jest.mock( '../../../hooks/use-analytics' );

const mockUseSeoOptIn = useSeoOptIn as jest.MockedFunction< typeof useSeoOptIn >;
const mockGetWindowState = getMyJetpackWindowInitialState as jest.MockedFunction<
	typeof getMyJetpackWindowInitialState
>;
const mockUseAnalytics = useAnalytics as jest.MockedFunction< typeof useAnalytics >;

const recordEvent = jest.fn();
const optIn = jest.fn();

describe( 'SeoOptInCard', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockUseAnalytics.mockReturnValue( { recordEvent } );
		mockUseSeoOptIn.mockReturnValue( { optIn, isPending: false } );
		mockGetWindowState.mockReturnValue( { showCard: true, redirect: '' } );
	} );

	it( 'renders the notice and records a view event when the card is eligible', () => {
		render( <SeoOptInCard /> );

		expect( screen.getByText( 'A fresh way to manage your SEO' ) ).toBeInTheDocument();
		expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_myjetpack_seo_opt_in_card_view', {} );
	} );

	it( 'renders nothing and records no view event when the card is not eligible', () => {
		mockGetWindowState.mockReturnValue( { showCard: false, redirect: '' } );

		const { container } = render( <SeoOptInCard /> );

		expect( container ).toBeEmptyDOMElement();
		expect( recordEvent ).not.toHaveBeenCalled();
	} );

	it( 'opts in and records a click event when the CTA is clicked', async () => {
		render( <SeoOptInCard /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Try the new SEO experience' } ) );

		expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_myjetpack_seo_opt_in_card_click', {} );
		expect( optIn ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'shows the busy label and disables the CTA while opting in', () => {
		mockUseSeoOptIn.mockReturnValue( { optIn, isPending: true } );

		render( <SeoOptInCard /> );

		expect( screen.getByRole( 'button', { name: 'Enabling…' } ) ).toBeDisabled();
	} );
} );
