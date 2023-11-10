/**
 * Plans actions
 */
export const ACTION_SET_PLANS = 'SET_PLANS';
export const ACTION_FETCH_FROM_API = 'FETCH_FROM_API';

/**
 * AI Assistant feature Actions
 */
export const ACTION_STORE_AI_ASSISTANT_FEATURE = 'STORE_AI_ASSISTANT_FEATURE';
export const ACTION_REQUEST_AI_ASSISTANT_FEATURE = 'REQUEST_AI_ASSISTANT_FEATURE';
export const ACTION_INCREASE_AI_ASSISTANT_REQUESTS_COUNT = 'INCREASE_AI_ASSISTANT_REQUESTS_COUNT';
export const ACTION_SET_AI_ASSISTANT_FEATURE_REQUIRE_UPGRADE =
	'SET_AI_ASSISTANT_FEATURE_REQUIRE_UPGRADE';
/**
 * Endpoints
 */
export const ENDPOINT_AI_ASSISTANT_FEATURE = '/wpcom/v2/jetpack-ai/ai-assistant-feature';

/**
 * New AI Assistant feature async request
 */
export const FREE_PLANT_REQUESTS_LIMIT = 20;
export const ASYNC_REQUEST_COUNTDOWN_INIT_VALUE = 3;
export const NEW_ASYNC_REQUEST_TIMER_INTERVAL = 5000;
export const ACTION_DECREASE_NEW_ASYNC_REQUEST_COUNTDOWN = 'DECREASE_NEW_ASYNC_REQUEST_COUNTDOWN';
export const ACTION_ENQUEUE_ASYNC_REQUEST = 'ENQUEUE_ASYNC_COUNTDOWN_REQUEST';
export const ACTION_DEQUEUE_ASYNC_REQUEST = 'DEQUEUE_ASYNC_COUNTDOWN_REQUEST';
