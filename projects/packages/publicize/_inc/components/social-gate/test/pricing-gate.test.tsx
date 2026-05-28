import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PricingGate from '../pricing-gate';

const mockSetShowPricingPage = jest.fn();
const mockUpdateSocialModuleSettings = jest.fn( () => Promise.resolve() );

jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( {
		setShowPricingPage: mockSetShowPricingPage,
		updateSocialModuleSettings: mockUpdateSocialModuleSettings,
	} ),
	useSelect: () => false,
} ) );
jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: () => ( { site: { wpcom: { blog_id: 1 }, suffix: 'example.com' } } ),
} ) );
jest.mock( '../../../hooks/use-product-info', () => ( {
	__esModule: true,
	default: () => [ { currencyCode: 'USD', v1: { price: 10, introOffer: null } } ],
} ) );
jest.mock( '../../../utils', () => ( {
	getSocialScriptData: () => ( { is_publicize_enabled: true } ),
	getRefreshPlanQuery: () => '',
} ) );
jest.mock( '../../../social-store', () => ( { store: {} } ) );

describe( 'PricingGate', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockUpdateSocialModuleSettings.mockReturnValue( Promise.resolve() );
	} );

	it( 'dismisses the pricing page on "Start for free"', async () => {
		const user = userEvent.setup();
		render( <PricingGate onDismiss={ jest.fn() } /> );
		await user.click( screen.getByRole( 'button', { name: /start for free/i } ) );
		expect( mockSetShowPricingPage ).toHaveBeenCalledWith( false );
	} );

	it( 'renders the upgrade CTA', () => {
		render( <PricingGate onDismiss={ jest.fn() } /> );
		expect( screen.getByRole( 'button', { name: /get social/i } ) ).toBeInTheDocument();
	} );
} );
