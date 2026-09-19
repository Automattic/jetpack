import { isPartnerCouponDismissed } from '@automattic/jetpack-partner-coupon';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import useMyJetpackConnection from '../../../hooks/use-my-jetpack-connection';
import PartnerCouponGate from '../index';

jest.mock( '../../../hooks/use-my-jetpack-connection', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

jest.mock( '@automattic/jetpack-partner-coupon', () => ( {
	__esModule: true,
	isPartnerCouponDismissed: jest.fn( () => false ),
	PartnerCouponRedeem: ( { onRemindMeLater } ) => (
		<button data-testid="partner-coupon-screen" onClick={ onRemindMeLater }>
			Remind me later
		</button>
	),
} ) );

const partnerCoupon = {
	coupon: {
		coupon_code: 'JPTST_JPTA_abc123',
		preset: 'JPTA',
		partner: { name: 'Jetpack Test Partner', prefix: 'JPTST' },
		product: {
			title: 'Jetpack Backup',
			slug: 'jetpack_backup_daily',
			description: 'Backups.',
			features: [],
		},
	},
	assetBaseUrl: 'https://example.org/wp-content/plugins/jetpack',
};

const renderGate = () =>
	render(
		<PartnerCouponGate>
			<div data-testid="dashboard" />
		</PartnerCouponGate>
	);

describe( 'PartnerCouponGate', () => {
	beforeEach( () => {
		( useMyJetpackConnection as jest.Mock ).mockReturnValue( {
			hasConnectedOwner: true,
			isUserConnected: false,
		} );
		( isPartnerCouponDismissed as jest.Mock ).mockReturnValue( false );
	} );

	afterEach( () => {
		delete window.myJetpackInitialState.partnerCoupon;
	} );

	it( 'renders the dashboard when no coupon screen applies', () => {
		renderGate();

		expect( screen.getByTestId( 'dashboard' ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'partner-coupon-screen' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the coupon screen in place of the dashboard', () => {
		window.myJetpackInitialState.partnerCoupon = partnerCoupon;

		renderGate();

		expect( screen.getByTestId( 'partner-coupon-screen' ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'dashboard' ) ).not.toBeInTheDocument();
	} );

	it( 'falls through to the dashboard on "Remind me later"', async () => {
		window.myJetpackInitialState.partnerCoupon = partnerCoupon;
		renderGate();

		await userEvent.click( screen.getByTestId( 'partner-coupon-screen' ) );

		expect( screen.getByTestId( 'dashboard' ) ).toBeInTheDocument();
	} );

	it( 'skips a post-connection screen dismissed earlier', () => {
		( isPartnerCouponDismissed as jest.Mock ).mockReturnValue( true );
		window.myJetpackInitialState.partnerCoupon = partnerCoupon;

		renderGate();

		expect( screen.getByTestId( 'dashboard' ) ).toBeInTheDocument();
	} );

	it( 'keeps the pre-connection screen even with a stored dismissal', () => {
		( useMyJetpackConnection as jest.Mock ).mockReturnValue( {
			hasConnectedOwner: false,
			isUserConnected: false,
		} );
		( isPartnerCouponDismissed as jest.Mock ).mockReturnValue( true );
		window.myJetpackInitialState.partnerCoupon = partnerCoupon;

		renderGate();

		expect( screen.getByTestId( 'partner-coupon-screen' ) ).toBeInTheDocument();
	} );
} );
