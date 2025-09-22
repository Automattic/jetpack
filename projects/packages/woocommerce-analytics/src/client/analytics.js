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
	init = () => {
		if ( this.isInitialized ) {
			return;
		}

		/*
		 * Initialize the session manager and record the page_view event
		 * only if the ClickHouse (ch) feature is enabled as these events are relevant exclusively when ClickHouse is active.
		 */
		if ( this.features.ch ) {
			this.sessionManager.init();

			// Add session ID and landing page to common properties.
			this.commonProps = {
				...this.commonProps,
				sessionId: this.sessionManager.sessionId,
				landingPage: this.sessionManager.landingPage,
			};

			// Record session started event if it's a new session.
			if ( this.sessionManager.isNewSession && this.sessionManager.sessionId ) {
				this.recordEvent( 'session_started' );
			} else {
				this.maybeRecordEngagementEvent();
			}

			this.recordEvent( 'page_view' );
		}

		this.processEventQueue();
		this.initListeners();

		this.isInitialized = true;
	};

	/**
	 * Initialize Listeners for pages.
	 */
	initListeners = () => {
		// Initialize Listeners for pages.
		if ( this.pages.isAccountPage ) {
			import( './listeners/account' ).then( ( { initListeners } ) => {
				initListeners( this.recordEvent );
			} );
		}

		if ( this.pages.isCart ) {
			import( './listeners/cart' ).then( ( { initListeners } ) => {
				initListeners( this.recordEvent );
			} );
		}
	};

	/**
	 * Process the event queue.
	 */
	processEventQueue = () => {
		// Record events from the queue.
		for ( const event of this.eventQueue ) {
			this.recordEvent( event.eventName, event.props );
		}
	};

	/**
	 * Record an event.
	 *
	 * @param {string} event      - The event name.
	 * @param {object} properties - The event properties.
	 */
	recordEvent = ( event, properties = {} ) => {
		if ( ! window._wca ) {
			debug( 'Skipping event recording because _wca is not defined' );
			return;
		}

		// Validate event name
		if ( typeof event !== 'string' || ! EVENT_NAME_REGEX.test( event ) ) {
			debug( 'Skipping event recording because event name is not valid' );
			return;
		}

		const eventProperties = {
			...this.commonProps,
			...properties,
		};

		if ( this.features.ch && CLICK_HOUSE_EVENTS.includes( event ) ) {
			eventProperties.ch = 1;
		} else {
			delete eventProperties.ch;
		}

		const eventName = `${ EVENT_PREFIX }${ event }`;
		eventProperties._en = eventName;

		debug( 'Record event "%s" called with props %o', eventName, eventProperties );
		window._wca.push( eventProperties );

		// Post initialization, maybe record engagement event.
		if ( this.isInitialized ) {
			this.maybeRecordEngagementEvent();
		}
	};

	/**
	 * Record the session engagement event if session is not engaged and session ID is set.
	 */
	maybeRecordEngagementEvent = () => {
		if ( ! this.features.ch ) {
			return;
		}

		if ( ! this.sessionManager.sessionId || this.sessionManager.isEngaged ) {
			return;
		}

		this.sessionManager.setEngaged();
		this.recordEvent( 'session_engagement' );
	};
}
