import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { PRODUCT_STATUSES } from '../../../constants';
import ActionButton from '../index';

const mockUseProduct = jest.fn();
const mockUseProductsByOwnership = jest.fn();

jest.mock( '../../../data/products/use-product', () => ( {
	__esModule: true,
	default: ( ...args ) => mockUseProduct( ...args ),
} ) );

jest.mock( '../../../data/products/use-products-by-ownership', () => ( {
	__esModule: true,
	default: () => mockUseProductsByOwnership(),
} ) );

/*
 * Every hook below returns one closure-captured value. Handing back a fresh object or
 * function per call changes the identity ActionButton's useMemo/useEffect chain keys on,
 * which re-renders forever and takes the Jest worker's heap with it.
 */
jest.mock( '../../../data/products/use-activate-plugins', () => {
	const result = { activate: () => {}, isPending: false };
	return { __esModule: true, default: () => result };
} );

jest.mock( '../../../data/products/use-install-plugins', () => {
	const result = { install: () => {}, isPending: false };
	return { __esModule: true, default: () => result };
} );

jest.mock( '../../../hooks/use-my-jetpack-connection', () => {
	const result = { siteIsRegistering: false, isRegistered: true, isUserConnected: true };
	return { __esModule: true, default: () => result };
} );

jest.mock( '../../../hooks/use-my-jetpack-navigate', () => {
	const navigate = () => {};
	return { __esModule: true, default: () => navigate };
} );

jest.mock( '../../../hooks/use-analytics', () => {
	const result = { recordEvent: () => {} };
	return { __esModule: true, default: () => result };
} );

jest.mock( '../../../hooks/use-outside-alerter', () => ( {
	__esModule: true,
	default: () => {},
} ) );

jest.mock( '@automattic/jetpack-connection', () => ( {
	getUserConnectionUrl: () => 'https://example.org/connect',
} ) );

jest.mock( '@wordpress/ui', () => {
	const react = jest.requireActual( 'react' );
	const asElement =
		tag =>
		( { children, ...props } ) => {
			// Component-only props that shouldn't land on the DOM node.
			delete props.variant;
			delete props.tone;
			delete props.size;
			delete props.openInNewTab;
			delete props.nativeButton;
			delete props.loading;
			delete props.loadingAnnouncement;
			return react.createElement( tag, props, children );
		};

	return {
		Button: asElement( 'button' ),
		Link: asElement( 'a' ),
		LinkButton: asElement( 'a' ),
	};
} );

/**
 * The action every status has to offer, per the state table in JETPACK-2392.
 *
 * The plan states that reach each status are covered by tests/php/Plan_Matrix_Test.php; this
 * is the other half of the same contract, and the status string is the join between them.
 */
const MATRIX: Array< { status: string; isOwned: boolean; label: string } > = [
	{ status: PRODUCT_STATUSES.ACTIVE, isOwned: true, label: 'View' },
	{ status: PRODUCT_STATUSES.INACTIVE, isOwned: true, label: 'Activate' },
	{ status: PRODUCT_STATUSES.MODULE_DISABLED, isOwned: true, label: 'Activate' },
	{ status: PRODUCT_STATUSES.NEEDS_ACTIVATION, isOwned: true, label: 'Activate' },
	{ status: PRODUCT_STATUSES.ABSENT, isOwned: false, label: 'Learn more' },
	{ status: PRODUCT_STATUSES.NEEDS_PLAN, isOwned: false, label: 'Learn more' },
	{ status: PRODUCT_STATUSES.NEEDS_FIRST_SITE_CONNECTION, isOwned: false, label: 'Learn more' },
	{ status: PRODUCT_STATUSES.CAN_UPGRADE, isOwned: false, label: 'Upgrade' },
	{ status: PRODUCT_STATUSES.EXPIRING_SOON, isOwned: true, label: 'Renew my plan' },
	{ status: PRODUCT_STATUSES.EXPIRED, isOwned: true, label: 'Resume my plan' },
	{ status: PRODUCT_STATUSES.SITE_CONNECTION_ERROR, isOwned: true, label: 'Connect' },
	{ status: PRODUCT_STATUSES.USER_CONNECTION_ERROR, isOwned: true, label: 'Connect' },
	{ status: PRODUCT_STATUSES.NEEDS_ATTENTION__ERROR, isOwned: true, label: 'Troubleshoot' },
	{ status: PRODUCT_STATUSES.NEEDS_ATTENTION__WARNING, isOwned: true, label: 'Troubleshoot' },
];

/**
 * Statuses Plan_Matrix_Test says a site that owns the product can be in. None of them may
 * put an upsell on the card -- that is the whole of the JETPACK-2392 correctness metric.
 */
const OWNED_STATUSES = [
	PRODUCT_STATUSES.ACTIVE,
	PRODUCT_STATUSES.INACTIVE,
	PRODUCT_STATUSES.MODULE_DISABLED,
	PRODUCT_STATUSES.NEEDS_ACTIVATION,
	PRODUCT_STATUSES.ABSENT_WITH_PLAN,
];

const UPSELL_LABELS = [ 'Learn more', 'Get plan' ];

const primaryActionFor = ( status: string, isOwned: boolean ) => {
	mockUseProduct.mockReturnValue( {
		detail: {
			status,
			manageUrl: 'https://example.org/manage',
			purchaseUrl: 'https://example.org/purchase',
			managePaidPlanPurchaseUrl: 'https://example.org/manage-plan',
			renewPaidPlanPurchaseUrl: 'https://example.org/renew',
			requiresUserConnection: false,
		},
		isLoading: false,
		isRefetching: false,
	} );
	mockUseProductsByOwnership.mockReturnValue( {
		data: { ownedProducts: isOwned ? [ 'videopress' ] : [] },
	} );

	render( <ActionButton slug="videopress" tracksIdentifier="test_card" /> );

	// The card renders one control, as a link or a button depending on whether the action navigates.
	return screen.queryByRole( 'link' ) ?? screen.getByRole( 'button' );
};

/**
 * Exact-match the whole label. toHaveTextContent's string form matches substrings, which
 * would let "Activate" pass against "Install and activate".
 *
 * @param {string} label - The full label the card should render.
 * @return {RegExp} Anchored matcher for that label.
 */
const exactly = ( label: string ) => new RegExp( `^${ label }$` );

describe( 'the product card primary action', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it.each( MATRIX )( 'offers "$label" for $status', ( { status, isOwned, label } ) => {
		expect( primaryActionFor( status, isOwned ) ).toHaveTextContent( exactly( label ) );
	} );

	it.each( OWNED_STATUSES )( 'never upsells a site that owns the product: %s', status => {
		const action = primaryActionFor( status, true );

		UPSELL_LABELS.forEach( upsell => {
			expect( action ).not.toHaveTextContent( exactly( upsell ) );
		} );
	} );

	/*
	 * Owning a standalone product without the plugin should take one press to fix, not two.
	 * Remove the .failing once JETPACK-2393 lands.
	 */
	it.failing( 'offers to install and activate a standalone product the site owns', () => {
		expect( primaryActionFor( PRODUCT_STATUSES.ABSENT_WITH_PLAN, true ) ).toHaveTextContent(
			exactly( 'Install and activate' )
		);
	} );
} );
