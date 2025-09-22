/**
 * External dependencies
 */
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import { EVENT_NAME_REGEX, EVENT_PREFIX, CLICK_HOUSE_EVENTS } from './constants';
import SessionManager from './session-manager';

const debug = debugFactory( 'wc-analytics:analytics' );

/**
 * Analytics class for WooCommerce Analytics.
 *
 */
export class Analytics {
	/**
	 * Constructor for the Analytics class.
	 *
	 * @param {SessionManager} sessionManager          - The session manager.
	 *
	 * @param {object}         wcAnalytics             - The WooCommerce Analytics object.
	 * @param {Array}          wcAnalytics.eventQueue  - The event queue.
	 * @param {object}         wcAnalytics.commonProps - The common properties.
	 * @param {object}         wcAnalytics.features    - The features.
	 * @param {object}         wcAnalytics.pages       - The pages.
	 */
	constructor( sessionManager, { eventQueue = [], commonProps = {}, features = {}, pages = {} } ) {
		this.isInitialized = false;

		this.sessionManager = sessionManager;
		this.eventQueue = eventQueue;
		this.commonProps = commonProps;
		this.features = features;
		this.pages = pages;
	}

	/**
	 * Initialize the analytics.
	 */
	init() {
		this.commonProps = {
			...this.commonProps,
			sessionId: this.sessionManager.sessionId,
			landingPage: this.sessionManager.landingPage,
		};

		if ( this.sessionManager.isNewSession ) {
			this.recordEvent( 'session_started' );
		} else {
			this.maybeRecordEngagementEvent();
		}

		this.recordEvent( 'page_view' );
		this.processEventQueue();
		this.initListeners();
		this.isInitialized = true;
	}

	/**
	 * Initialize Listeners for pages.
	 */
	initListeners() {
		this.listenToStoreAPICalls();

		// Initialize Listeners for pages.
		if ( this.pages.isAccountPage ) {
			import( './listeners/account' ).then( ( { initListeners } ) => {
				initListeners( this );
			} );
		}

		if ( this.pages.isCart ) {
			import( './listeners/cart' ).then( ( { initListeners } ) => {
				initListeners( this );
			} );
		}
	}

	/**
	 * Listen to Store API calls to record engagement event.
	 */
	listenToStoreAPICalls() {
		const originalFetch = window.fetch;
		const self = this;

		window.fetch = function ( url, options = {} ) {
			const urlString = url.toString();
			const method = options.method?.toLowerCase() || 'get';

			const isPost = method === 'post';
			const isStoreAPIPath = urlString.includes( '/wc/store/v1' );
			if ( isPost && isStoreAPIPath ) {
				self.maybeRecordEngagementEvent();
			}

			return originalFetch.apply( this, arguments );
		};
	}

	/**
	 * Process the event queue.
	 */
	processEventQueue() {
		// Record events from the queue.
		for ( const event of this.eventQueue ) {
			this.recordEvent( event.eventName, event.props );
		}
	}

	/**
	 * Record an event.
	 *
	 * @param {string} event      - The event name.
	 * @param {object} properties - The event properties.
	 */
	recordEvent( event, properties = {} ) {
		if ( ! window._wca ) {
			return;
		}

		// Validate event name
		if ( typeof event !== 'string' || ! EVENT_NAME_REGEX.test( event ) ) {
			return;
		}

		const eventProperties = {
			...this.commonProps,
			...properties,
		};

		if ( this.features.ch && CLICK_HOUSE_EVENTS.includes( event ) ) {
			eventProperties.ch = 1;
		}

		eventProperties._en = `${ EVENT_PREFIX }${ event }`;

		debug( 'Record event "%s" called with props %o', eventProperties._en, eventProperties );

		window._wca.push( eventProperties );

		if ( this.isInitialized ) {
			this.maybeRecordEngagementEvent();
		}
	}

	maybeRecordEngagementEvent() {
		if ( this.sessionManager.isEngaged ) {
			return;
		}

		this.sessionManager.setEngaged();
		this.recordEvent( 'session_engagement' );
	}
}
