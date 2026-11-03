import { getSupportUrl, openWpcomSupportDoc } from 'components/support-link';
import { render, screen } from 'test/test-utils';
import { Earn, EarnFeatureButton } from '../index';

jest.mock( 'components/data/query-site', () => () => null );
jest.mock( '../ads', () => ( { Ads: () => 'Ads card' } ) );

jest.mock( 'lib/analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordJetpackClick: jest.fn() } },
} ) );

jest.mock( 'components/settings-card', () => ( {
	__esModule: true,
	default: ( { children } ) => <div>{ children }</div>,
} ) );

jest.mock( 'components/settings-group', () => ( {
	__esModule: true,
	default: ( { children } ) => <div>{ children }</div>,
} ) );

jest.mock( 'components/support-link', () => ( {
	__esModule: true,
	default: () => null,
	getSupportUrl: jest.fn( ( href, wpcomLink ) => wpcomLink ?? href ),
	openWpcomSupportDoc: jest.fn(),
} ) );

describe( 'EarnFeatureButton', () => {
	const props = {
		featureName: 'paypal',
		title: 'Collect PayPal payments',
		buttonText: 'Learn how to get started',
		infoDescription: 'Accept credit card payments via PayPal.',
		infoLink: 'https://jetpack.com/support/pay-with-paypal/',
		supportLink: 'https://jetpack.com/support/pay-with-paypal/',
	};
	const WPCOM_DOC = 'https://wordpress.com/support/wordpress-editor/blocks/pay-with-paypal/';

	afterEach( () => {
		getSupportUrl.mockClear();
		openWpcomSupportDoc.mockClear();
	} );

	it( 'opens the WordPress.com doc in the Help Center when a wpcomInfoLink is given', () => {
		render( <EarnFeatureButton { ...props } wpcomInfoLink={ WPCOM_DOC } /> );

		const cta = screen.getByRole( 'link', { name: /Learn how to get started/ } );
		expect( getSupportUrl ).toHaveBeenCalledWith( props.infoLink, WPCOM_DOC );
		expect( cta ).toHaveAttribute( 'href', WPCOM_DOC );

		cta.click();
		expect( openWpcomSupportDoc ).toHaveBeenCalledWith( expect.anything(), WPCOM_DOC );
	} );

	it( 'keeps the info link when no wpcomInfoLink is given', () => {
		render( <EarnFeatureButton { ...props } /> );

		const cta = screen.getByRole( 'link', { name: /Learn how to get started/ } );
		expect( cta ).toHaveAttribute( 'href', props.infoLink );

		cta.click();
		expect( openWpcomSupportDoc ).toHaveBeenCalledWith( expect.anything(), undefined );
	} );
} );

const findsEverything = () => true;
const findsOnlyEarn = module => module === 'earn';

describe( 'Earn', () => {
	afterEach( () => {
		delete window.JetpackScriptData;
	} );

	it.each( [
		[ 'keeps', false, true ],
		[ 'removes', true, false ],
	] )( '%s the payment cards when the settings flag is %s', ( _verb, flag, shown ) => {
		window.JetpackScriptData = { myJetpack: { settingsConsolidation: flag } };

		render( <Earn active isModuleFound={ findsEverything } hasConnectedOwner /> );

		expect( screen.getByText( 'Ads card' ) ).toBeInTheDocument();
		expect( Boolean( screen.queryByText( 'Enable payment button' ) ) ).toBe( shown );
	} );

	it( 'renders nothing for a search that finds only the removed payment cards', () => {
		window.JetpackScriptData = { myJetpack: { settingsConsolidation: true } };

		const { container } = render(
			<Earn searchTerm="paypal" isModuleFound={ findsOnlyEarn } hasConnectedOwner />
		);

		expect( container ).toBeEmptyDOMElement();
	} );
} );
