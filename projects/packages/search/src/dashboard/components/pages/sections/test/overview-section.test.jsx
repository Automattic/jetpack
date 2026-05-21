import { render, screen } from '@testing-library/react';
import OverviewSection from '../overview-section';

jest.mock( '@wordpress/ui', () => ( {
	Link: ( { children, href } ) => <a href={ href }>{ children }</a>,
	Notice: {
		Root: ( { children } ) => <div data-testid="upgrade-trigger">{ children }</div>,
		Description: ( { children } ) => <span data-testid="upgrade-description">{ children }</span>,
		Actions: ( { children } ) => <div>{ children }</div>,
		ActionButton: ( { children, onClick } ) => (
			<button data-testid="upgrade-cta" onClick={ onClick }>
				{ children }
			</button>
		),
	},
} ) );

jest.mock( '../../../donut-meter-container', () => {
	const DonutMeter = ( { title, current, limit } ) => (
		<div data-testid="donut-meter">
			{ title } { current }/{ limit }
		</div>
	);
	DonutMeter.displayName = 'DonutMeterContainer';
	return { __esModule: true, default: DonutMeter, formatNumber: n => String( n ) };
} );

jest.mock( '../plan-summary', () => ( { isFreePlan } ) => (
	<div data-testid="plan-summary">{ isFreePlan ? 'Free' : 'Paid' }</div>
) );

const makeUsage = ( overrides = {} ) => ( {
	must_upgrade: false,
	should_upgrade: false,
	upgrade_reason: { records: false, requests: false },
	months_over_plan_records_limit: 0,
	months_over_plan_requests_limit: 0,
	num_records: 100,
	...overrides,
} );

const makePlanInfo = ( usageOverrides = {} ) => ( {
	currentUsage: makeUsage( usageOverrides ),
	currentPlan: { record_limit: 500, monthly_search_request_limit: 1000 },
	latestMonthRequests: { num_requests: 50, start_date: '2026-02-01', end_date: '2026-02-28' },
} );

const defaultProps = {
	isFreePlan: false,
	planInfo: makePlanInfo(),
	sendPaidPlanToCart: jest.fn(),
	isPlanJustUpgraded: false,
};

describe( 'OverviewSection', () => {
	it( 'renders usage meters', () => {
		render( <OverviewSection { ...defaultProps } /> );
		const meters = screen.getAllByTestId( 'donut-meter' );
		expect( meters ).toHaveLength( 2 );
	} );

	it( 'renders plan summary', () => {
		render( <OverviewSection { ...defaultProps } /> );
		expect( screen.getByTestId( 'plan-summary' ) ).toBeInTheDocument();
	} );

	it( 'renders "tell me more" link', () => {
		render( <OverviewSection { ...defaultProps } /> );
		expect( screen.getByRole( 'link', { name: /record indexing/i } ) ).toBeInTheDocument();
	} );

	it( 'does not render upgrade trigger for paid plan with no overage', () => {
		render( <OverviewSection { ...defaultProps } isFreePlan={ false } /> );
		expect( screen.queryByTestId( 'upgrade-trigger' ) ).not.toBeInTheDocument();
	} );

	it( 'renders upgrade trigger for free plan when should_upgrade is true', () => {
		const planInfo = makePlanInfo( { should_upgrade: true } );
		render( <OverviewSection { ...defaultProps } isFreePlan={ true } planInfo={ planInfo } /> );
		expect( screen.getByTestId( 'upgrade-trigger' ) ).toBeInTheDocument();
	} );

	it( 'renders search-disabled message when must_upgrade is true', () => {
		const planInfo = makePlanInfo( { must_upgrade: true } );
		render( <OverviewSection { ...defaultProps } planInfo={ planInfo } /> );
		expect( screen.getByTestId( 'upgrade-description' ) ).toHaveTextContent(
			/exceeded the limits/i
		);
	} );

	it( 'renders records overage message', () => {
		const planInfo = makePlanInfo( {
			should_upgrade: true,
			upgrade_reason: { records: true, requests: false },
			months_over_plan_records_limit: 1,
		} );
		render( <OverviewSection { ...defaultProps } isFreePlan={ true } planInfo={ planInfo } /> );
		expect( screen.getByTestId( 'upgrade-description' ) ).toHaveTextContent( /records/i );
	} );

	it( 'renders requests overage message', () => {
		const planInfo = makePlanInfo( {
			should_upgrade: true,
			upgrade_reason: { records: false, requests: true },
			months_over_plan_requests_limit: 1,
		} );
		render( <OverviewSection { ...defaultProps } isFreePlan={ true } planInfo={ planInfo } /> );
		expect( screen.getByTestId( 'upgrade-description' ) ).toHaveTextContent( /requests/i );
	} );

	it( 'renders both-overage message when records and requests both over', () => {
		const planInfo = makePlanInfo( {
			should_upgrade: true,
			upgrade_reason: { records: true, requests: true },
			months_over_plan_records_limit: 1,
		} );
		render( <OverviewSection { ...defaultProps } isFreePlan={ true } planInfo={ planInfo } /> );
		expect( screen.getByTestId( 'upgrade-description' ) ).toHaveTextContent(
			/records and search requests/i
		);
	} );

	it( 'renders no-overage upgrade message when should_upgrade with no specific reason', () => {
		const planInfo = makePlanInfo( {
			should_upgrade: true,
			upgrade_reason: { records: false, requests: false },
		} );
		render( <OverviewSection { ...defaultProps } isFreePlan={ true } planInfo={ planInfo } /> );
		expect( screen.getByTestId( 'upgrade-description' ) ).toHaveTextContent(
			/increase your site records/i
		);
	} );

	it( 'renders "continue using" CTA when records over limit for 3+ months', () => {
		const planInfo = makePlanInfo( {
			should_upgrade: true,
			upgrade_reason: { records: true, requests: false },
			months_over_plan_records_limit: 3,
		} );
		render( <OverviewSection { ...defaultProps } isFreePlan={ true } planInfo={ planInfo } /> );
		expect( screen.getByTestId( 'upgrade-cta' ) ).toHaveTextContent( /continue using/i );
	} );

	it( 'does not render upgrade trigger when planInfo has no currentUsage', () => {
		const planInfo = { ...makePlanInfo(), currentUsage: undefined };
		render( <OverviewSection { ...defaultProps } planInfo={ planInfo } /> );
		expect( screen.queryByTestId( 'upgrade-trigger' ) ).not.toBeInTheDocument();
	} );
} );
