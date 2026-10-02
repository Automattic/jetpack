import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import useDismissA4ABanner from '../../../data/use-dismiss-a4a-banner';
import useAnalytics from '../../../hooks/use-analytics';
import A4ABanner from '../index';

jest.mock( '../../../data/use-dismiss-a4a-banner' );
jest.mock( '../../../hooks/use-analytics' );

const mockUseDismissA4ABanner = useDismissA4ABanner as jest.MockedFunction<
	typeof useDismissA4ABanner
>;
const mockUseAnalytics = useAnalytics as jest.MockedFunction< typeof useAnalytics >;

const recordEvent = jest.fn();
const dismiss = jest.fn();

const DISMISS_LABEL = 'Dismiss the Automattic for Agencies banner';

describe( 'A4ABanner', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockUseAnalytics.mockReturnValue( { recordEvent } );
		mockUseDismissA4ABanner.mockReturnValue( { dismiss, isPending: false } );
	} );

	it( 'renders the banner with a dismiss button', () => {
		render( <A4ABanner /> );

		expect( screen.getByText( 'Are you an agency or freelancer?' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: DISMISS_LABEL } ) ).toBeInTheDocument();
	} );

	it( 'hides the banner, persists the dismissal and records a Tracks event on dismiss', async () => {
		render( <A4ABanner /> );

		await userEvent.click( screen.getByRole( 'button', { name: DISMISS_LABEL } ) );

		expect( dismiss ).toHaveBeenCalledTimes( 1 );
		expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_myjetpack_manage_banner_dismiss', {
			feature: 'manage',
		} );
		expect( screen.queryByText( 'Are you an agency or freelancer?' ) ).not.toBeInTheDocument();
	} );

	it( 'renders nothing for an agency account', () => {
		const { container } = render( <A4ABanner isAgencyAccount={ true } /> );

		expect( container ).toBeEmptyDOMElement();
	} );
} );
