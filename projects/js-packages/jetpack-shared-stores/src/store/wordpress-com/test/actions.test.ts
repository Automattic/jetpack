import apiFetch from '@wordpress/api-fetch';
import actions, { mapAiFeatureResponseToAiFeatureProps } from '../actions.ts';
import {
	ACTION_DECREASE_NEW_ASYNC_REQUEST_COUNTDOWN,
	ACTION_DEQUEUE_ASYNC_REQUEST,
	ACTION_ENQUEUE_ASYNC_REQUEST,
	ACTION_FETCH_FROM_API,
	ACTION_INCREASE_AI_ASSISTANT_REQUESTS_COUNT,
	ACTION_REQUEST_AI_ASSISTANT_FEATURE,
	ACTION_SET_AI_ASSISTANT_FEATURE_REQUIRE_UPGRADE,
	ACTION_SET_PLANS,
	ACTION_SET_TIER_PLANS_ENABLED,
	ACTION_STORE_AI_ASSISTANT_FEATURE,
	ENDPOINT_AI_ASSISTANT_FEATURE,
	NEW_ASYNC_REQUEST_TIMER_INTERVAL,
} from '../constants.ts';
import type {
	AiFeatureProps,
	Plan,
	SiteAIAssistantFeatureEndpointResponseProps,
	TierProp,
} from '../types.ts';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

type TestAiFeatureEndpointResponse = Omit<
	SiteAIAssistantFeatureEndpointResponseProps,
	'usage-period'
> & {
	'usage-period'?: Partial< SiteAIAssistantFeatureEndpointResponseProps[ 'usage-period' ] >;
	'tier-plans-enabled'?: boolean | number;
};

type DispatchMock = jest.Mock & {
	dequeueAiAssistantFeatureAsyncRequest?: jest.Mock;
};

const mockedApiFetch = apiFetch as unknown as jest.Mock;

const currentTier: TierProp = {
	slug: 'ai-assistant-tier-100',
	limit: 100,
	value: 100,
};

const nextTier: TierProp = {
	slug: 'ai-assistant-tier-200',
	limit: 200,
	value: 200,
};

const costs = {
	'ai-assistant-tier-100': {
		monthly: 10,
		yearly: 100,
	},
};

const featuresControl = {
	'ai-assistant': {
		enabled: true,
		'min-jetpack-version': '14.8',
		'inline-suggestions': {
			enabled: false,
			'min-jetpack-version': '14.9',
		},
	},
};

const endpointResponse: TestAiFeatureEndpointResponse = {
	'has-feature': true,
	'is-over-limit': false,
	'requests-count': 7,
	'requests-limit': 20,
	'usage-period': {
		'current-start': '2026-06-01T00:00:00+00:00',
		'next-start': '2026-07-01T00:00:00+00:00',
		'requests-count': 3,
	},
	'site-require-upgrade': false,
	'error-message': 'Upgrade required.',
	'error-code': 'upgrade_required',
	'upgrade-type': 'default',
	'current-tier': currentTier,
	'tier-plans': [ currentTier, nextTier ],
	'next-tier': nextTier,
	'tier-plans-enabled': true,
	costs,
	'features-control': featuresControl,
};

const getEndpointResponse = (
	response: Partial< TestAiFeatureEndpointResponse > = {}
): SiteAIAssistantFeatureEndpointResponseProps => {
	return {
		...endpointResponse,
		...response,
	} as SiteAIAssistantFeatureEndpointResponseProps;
};

const mapResponse = ( response: Partial< TestAiFeatureEndpointResponse > = {} ) => {
	return mapAiFeatureResponseToAiFeatureProps( getEndpointResponse( response ) );
};

// `dispatch` is a function that also carries a `dequeueAiAssistantFeatureAsyncRequest`
// bound action, which `enqueueAiAssistantFeatureAsyncRequest` calls as a method.
const createDispatch = (): DispatchMock =>
	Object.assign( jest.fn(), {
		dequeueAiAssistantFeatureAsyncRequest: jest.fn(),
	} ) as DispatchMock;

describe( 'mapAiFeatureResponseToAiFeatureProps', () => {
	it( 'should map the endpoint response to the AI Assistant feature props', () => {
		expect( mapResponse() ).toEqual( {
			hasFeature: true,
			isOverLimit: false,
			requestsCount: 7,
			requestsLimit: 20,
			requireUpgrade: false,
			errorMessage: 'Upgrade required.',
			errorCode: 'upgrade_required',
			upgradeType: 'default',
			usagePeriod: {
				currentStart: '2026-06-01T00:00:00+00:00',
				nextStart: '2026-07-01T00:00:00+00:00',
				requestsCount: 3,
			},
			currentTier,
			nextTier,
			tierPlansEnabled: true,
			costs,
			featuresControl,
		} );
	} );

	// The full-object test above already pins every straight key rename. The tests
	// below only cover the transformation logic the mapper actually performs:
	// boolean coercion and usage-period defaulting.
	it( 'should coerce has-feature to a boolean hasFeature', () => {
		expect( mapResponse( { 'has-feature': 1 as unknown as boolean } ).hasFeature ).toBe( true );
		expect( mapResponse( { 'has-feature': 0 as unknown as boolean } ).hasFeature ).toBe( false );
	} );

	it( 'should coerce is-over-limit to a boolean isOverLimit', () => {
		expect( mapResponse( { 'is-over-limit': 1 as unknown as boolean } ).isOverLimit ).toBe( true );
		expect( mapResponse( { 'is-over-limit': 0 as unknown as boolean } ).isOverLimit ).toBe( false );
	} );

	it( 'should coerce site-require-upgrade to a boolean requireUpgrade', () => {
		expect(
			mapResponse( { 'site-require-upgrade': 1 as unknown as boolean } ).requireUpgrade
		).toBe( true );
		expect(
			mapResponse( { 'site-require-upgrade': 0 as unknown as boolean } ).requireUpgrade
		).toBe( false );
	} );

	it( 'should coerce tier-plans-enabled to a boolean tierPlansEnabled', () => {
		expect( mapResponse( { 'tier-plans-enabled': 1 } ).tierPlansEnabled ).toBe( true );
		expect( mapResponse( { 'tier-plans-enabled': 0 } ).tierPlansEnabled ).toBe( false );
	} );

	it( 'should default usagePeriod.requestsCount to 0 when usage-period requests-count is missing', () => {
		expect(
			mapResponse( {
				'usage-period': {
					'current-start': '2026-06-01T00:00:00+00:00',
					'next-start': '2026-07-01T00:00:00+00:00',
				},
			} ).usagePeriod.requestsCount
		).toBe( 0 );
	} );

	it( 'should default usagePeriod values when usage-period is missing', () => {
		expect( mapResponse( { 'usage-period': undefined } ).usagePeriod ).toEqual( {
			currentStart: undefined,
			nextStart: undefined,
			requestsCount: 0,
		} );
	} );
} );

describe( 'setPlans', () => {
	it( 'should create an action to set plans', () => {
		const plans: Array< Plan > = [
			{
				product_id: 123,
				product_name: 'Jetpack AI',
				product_slug: 'jetpack_ai',
			},
		];

		expect( actions.setPlans( plans ) ).toEqual( {
			type: ACTION_SET_PLANS,
			plans,
		} );
	} );
} );

describe( 'fetchFromAPI', () => {
	it( 'should create an action to fetch from the API', () => {
		expect( actions.fetchFromAPI( '/wpcom/v2/test' ) ).toEqual( {
			type: ACTION_FETCH_FROM_API,
			url: '/wpcom/v2/test',
		} );
	} );
} );

describe( 'storeAiAssistantFeature', () => {
	it( 'should create an action to store the AI Assistant feature', () => {
		const feature: AiFeatureProps = mapResponse();

		expect( actions.storeAiAssistantFeature( feature ) ).toEqual( {
			type: ACTION_STORE_AI_ASSISTANT_FEATURE,
			feature,
		} );
	} );
} );

describe( 'setAiAssistantFeatureRequireUpgrade', () => {
	it( 'should create an action that requires an upgrade by default', () => {
		expect( actions.setAiAssistantFeatureRequireUpgrade() ).toEqual( {
			type: ACTION_SET_AI_ASSISTANT_FEATURE_REQUIRE_UPGRADE,
			requireUpgrade: true,
		} );
	} );

	it( 'should create an action that explicitly does not require an upgrade', () => {
		expect( actions.setAiAssistantFeatureRequireUpgrade( false ) ).toEqual( {
			type: ACTION_SET_AI_ASSISTANT_FEATURE_REQUIRE_UPGRADE,
			requireUpgrade: false,
		} );
	} );
} );

describe( 'setTierPlansEnabled', () => {
	it( 'should create an action that enables tier plans by default', () => {
		expect( actions.setTierPlansEnabled() ).toEqual( {
			type: ACTION_SET_TIER_PLANS_ENABLED,
			tierPlansEnabled: true,
		} );
	} );

	it( 'should create an action that explicitly disables tier plans', () => {
		expect( actions.setTierPlansEnabled( false ) ).toEqual( {
			type: ACTION_SET_TIER_PLANS_ENABLED,
			tierPlansEnabled: false,
		} );
	} );
} );

describe( 'fetchAiAssistantFeature', () => {
	beforeEach( () => {
		mockedApiFetch.mockReset();
	} );

	it( 'should request the AI Assistant feature endpoint', async () => {
		mockedApiFetch.mockResolvedValueOnce( getEndpointResponse() );

		await actions.fetchAiAssistantFeature()( { dispatch: createDispatch() } );

		expect( mockedApiFetch ).toHaveBeenCalledWith( {
			path: ENDPOINT_AI_ASSISTANT_FEATURE,
		} );
	} );

	it( 'should dispatch the request action before fetching the AI Assistant feature', async () => {
		const dispatch = createDispatch();
		mockedApiFetch.mockResolvedValueOnce( getEndpointResponse() );

		await actions.fetchAiAssistantFeature()( { dispatch } );

		expect( dispatch ).toHaveBeenNthCalledWith( 1, {
			type: ACTION_REQUEST_AI_ASSISTANT_FEATURE,
		} );
	} );

	it( 'should store the mapped AI Assistant feature after a successful request', async () => {
		const dispatch = createDispatch();
		const response = getEndpointResponse( {
			'requests-count': 14,
			'usage-period': {
				...endpointResponse[ 'usage-period' ],
				'requests-count': 8,
			},
		} );
		mockedApiFetch.mockResolvedValueOnce( response );

		await actions.fetchAiAssistantFeature()( { dispatch } );

		expect( dispatch ).toHaveBeenNthCalledWith(
			2,
			actions.storeAiAssistantFeature( mapAiFeatureResponseToAiFeatureProps( response ) )
		);
	} );

	it( 'should log API errors without throwing', async () => {
		const dispatch = createDispatch();
		const error = new Error( 'Request failed' );
		const consoleErrorSpy = jest.spyOn( console, 'error' ).mockImplementation( () => {} );
		mockedApiFetch.mockRejectedValueOnce( error );

		await expect( actions.fetchAiAssistantFeature()( { dispatch } ) ).resolves.toBeUndefined();

		expect( consoleErrorSpy ).toHaveBeenCalledWith( error );

		consoleErrorSpy.mockRestore();
	} );

	it( 'should not store the AI Assistant feature when the request fails', async () => {
		const dispatch = createDispatch();
		const consoleErrorSpy = jest.spyOn( console, 'error' ).mockImplementation( () => {} );
		mockedApiFetch.mockRejectedValueOnce( new Error( 'Request failed' ) );

		await actions.fetchAiAssistantFeature()( { dispatch } );

		expect( dispatch ).toHaveBeenCalledTimes( 1 );
		expect( dispatch ).toHaveBeenCalledWith( {
			type: ACTION_REQUEST_AI_ASSISTANT_FEATURE,
		} );

		consoleErrorSpy.mockRestore();
	} );
} );

describe( 'increaseAiAssistantRequestsCount', () => {
	afterEach( () => {
		jest.restoreAllMocks();
	} );

	it( 'should dispatch the increase action with the given count', () => {
		const dispatch = createDispatch();
		const decreaseAsyncRequestCountdownValueSpy = jest.spyOn(
			actions,
			'decreaseAsyncRequestCountdownValue'
		);

		actions.increaseAiAssistantRequestsCount( 5 )( { dispatch } );

		expect( dispatch ).toHaveBeenNthCalledWith( 1, {
			type: ACTION_INCREASE_AI_ASSISTANT_REQUESTS_COUNT,
			count: 5,
		} );
		expect( decreaseAsyncRequestCountdownValueSpy ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should dispatch the increase action with a default count of 1', () => {
		const dispatch = createDispatch();
		jest.spyOn( actions, 'decreaseAsyncRequestCountdownValue' );

		actions.increaseAiAssistantRequestsCount()( { dispatch } );

		expect( dispatch ).toHaveBeenNthCalledWith( 1, {
			type: ACTION_INCREASE_AI_ASSISTANT_REQUESTS_COUNT,
			count: 1,
		} );
	} );

	it( 'should dispatch decreaseAsyncRequestCountdownValue after increasing the count', () => {
		const dispatch = createDispatch();
		const decreaseAsyncRequestCountdownValueSpy = jest.spyOn(
			actions,
			'decreaseAsyncRequestCountdownValue'
		);

		actions.increaseAiAssistantRequestsCount( 2 )( { dispatch } );

		expect( decreaseAsyncRequestCountdownValueSpy ).toHaveBeenCalledTimes( 1 );
		// The decrease thunk is dispatched (a function), without coupling to its identity.
		expect( dispatch ).toHaveBeenCalledTimes( 2 );
		expect( dispatch ).toHaveBeenLastCalledWith( expect.any( Function ) );
	} );
} );

describe( 'decreaseAsyncRequestCountdownValue', () => {
	afterEach( () => {
		jest.restoreAllMocks();
	} );

	it( 'should dispatch the countdown decrease action', async () => {
		const dispatch = createDispatch();
		const select = {
			getAsyncRequestCountdownValue: jest.fn().mockReturnValue( 3 ),
		};

		await actions.decreaseAsyncRequestCountdownValue()( { dispatch, select } );

		expect( dispatch ).toHaveBeenCalledWith( {
			type: ACTION_DECREASE_NEW_ASYNC_REQUEST_COUNTDOWN,
		} );
	} );

	it( 'should enqueue an async request when the countdown reaches 0', async () => {
		const dispatch = createDispatch();
		const select = {
			getAsyncRequestCountdownValue: jest.fn().mockReturnValue( 0 ),
		};
		const enqueueAiAssistantFeatureAsyncRequestSpy = jest.spyOn(
			actions,
			'enqueueAiAssistantFeatureAsyncRequest'
		);

		await actions.decreaseAsyncRequestCountdownValue()( { dispatch, select } );

		expect( enqueueAiAssistantFeatureAsyncRequestSpy ).toHaveBeenCalledTimes( 1 );
		// The enqueue thunk is dispatched (a function), without coupling to its identity.
		expect( dispatch ).toHaveBeenLastCalledWith( expect.any( Function ) );
	} );

	it( 'should not enqueue an async request while the countdown is above 0', async () => {
		const dispatch = createDispatch();
		const select = {
			getAsyncRequestCountdownValue: jest.fn().mockReturnValue( 2 ),
		};
		const enqueueAiAssistantFeatureAsyncRequestSpy = jest.spyOn(
			actions,
			'enqueueAiAssistantFeatureAsyncRequest'
		);

		await actions.decreaseAsyncRequestCountdownValue()( { dispatch, select } );

		expect( enqueueAiAssistantFeatureAsyncRequestSpy ).not.toHaveBeenCalled();
		expect( dispatch ).toHaveBeenCalledTimes( 1 );
	} );
} );

describe( 'enqueueAiAssistantFeatureAsyncRequest', () => {
	beforeEach( () => {
		jest.useFakeTimers();
	} );

	afterEach( () => {
		jest.useRealTimers();
		jest.restoreAllMocks();
	} );

	it( 'should dequeue any existing async request before enqueueing a new one', () => {
		const dispatch = createDispatch();
		actions.enqueueAiAssistantFeatureAsyncRequest()( { dispatch } );

		expect( dispatch.dequeueAiAssistantFeatureAsyncRequest ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should dispatch the enqueue action with a timer id', () => {
		const dispatch = createDispatch();
		actions.enqueueAiAssistantFeatureAsyncRequest()( { dispatch } );

		expect( dispatch ).toHaveBeenCalledWith( {
			type: ACTION_ENQUEUE_ASYNC_REQUEST,
			timerId: expect.anything(),
		} );
	} );

	it( 'should not fetch the AI Assistant feature before the timer completes', () => {
		const dispatch = createDispatch();
		const fetchAiAssistantFeatureSpy = jest.spyOn( actions, 'fetchAiAssistantFeature' );

		actions.enqueueAiAssistantFeatureAsyncRequest()( { dispatch } );

		jest.advanceTimersByTime( NEW_ASYNC_REQUEST_TIMER_INTERVAL - 1 );

		expect( fetchAiAssistantFeatureSpy ).not.toHaveBeenCalled();
	} );

	it( 'should dispatch fetchAiAssistantFeature after the timer completes', () => {
		const dispatch = createDispatch();
		const fetchAiAssistantFeatureSpy = jest.spyOn( actions, 'fetchAiAssistantFeature' );

		actions.enqueueAiAssistantFeatureAsyncRequest()( { dispatch } );

		jest.advanceTimersByTime( NEW_ASYNC_REQUEST_TIMER_INTERVAL );

		expect( fetchAiAssistantFeatureSpy ).toHaveBeenCalledTimes( 1 );
		// The fetch thunk is dispatched (a function), without coupling to its identity.
		expect( dispatch ).toHaveBeenLastCalledWith( expect.any( Function ) );
	} );
} );

describe( 'dequeueAiAssistantFeatureAsyncRequest', () => {
	afterEach( () => {
		jest.restoreAllMocks();
	} );

	it( 'should dispatch the dequeue action', () => {
		const dispatch = createDispatch();
		const select = {
			getAsyncRequestCountdownTimerId: jest.fn().mockReturnValue( 0 ),
		};

		actions.dequeueAiAssistantFeatureAsyncRequest()( { dispatch, select } );

		expect( dispatch ).toHaveBeenCalledWith( {
			type: ACTION_DEQUEUE_ASYNC_REQUEST,
			timerId: 0,
		} );
	} );

	it( 'should return early when there is no timer id', () => {
		const dispatch = createDispatch();
		const select = {
			getAsyncRequestCountdownTimerId: jest.fn().mockReturnValue( 0 ),
		};
		const clearTimeoutSpy = jest.spyOn( window, 'clearTimeout' );

		actions.dequeueAiAssistantFeatureAsyncRequest()( { dispatch, select } );

		expect( clearTimeoutSpy ).not.toHaveBeenCalled();
	} );

	it( 'should clear the timeout when there is a timer id', () => {
		const dispatch = createDispatch();
		const timerId = 123;
		const select = {
			getAsyncRequestCountdownTimerId: jest.fn().mockReturnValue( timerId ),
		};
		const clearTimeoutSpy = jest.spyOn( window, 'clearTimeout' ).mockImplementation( () => {} );

		actions.dequeueAiAssistantFeatureAsyncRequest()( { dispatch, select } );

		expect( clearTimeoutSpy ).toHaveBeenCalledWith( timerId );
	} );
} );
