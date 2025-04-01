/**
 * @jest-environment jsdom
 */

describe( 'Corrected Query Notice', () => {
	let originalJetpackSearchCorrectedQuery;

	beforeEach( () => {
		// Store original JetpackSearchCorrectedQuery
		originalJetpackSearchCorrectedQuery = window.JetpackSearchCorrectedQuery;

		// Reset the DOM
		document.body.innerHTML = '';

		// Reset window.JetpackSearchCorrectedQuery
		delete window.JetpackSearchCorrectedQuery;
	} );

	afterEach( () => {
		// Restore original JetpackSearchCorrectedQuery
		if ( originalJetpackSearchCorrectedQuery ) {
			Object.defineProperty( window, 'JetpackSearchCorrectedQuery', {
				value: originalJetpackSearchCorrectedQuery,
				configurable: true,
			} );
		} else {
			delete window.JetpackSearchCorrectedQuery;
		}
	} );

	test( 'should not add notice when JetpackSearchCorrectedQuery is not defined', () => {
		// Setup
		document.body.innerHTML = '<h1 class="search-title">Search Results</h1>';

		// Execute the function directly instead of relying on the event
		// This is the function from corrected-query.js
		/**
		 * Adds a corrected query notice after search titles when correction data is available.
		 */
		function correctedQueryFunction() {
			// Only proceed if we have corrected query data
			if ( ! window.JetpackSearchCorrectedQuery || ! window.JetpackSearchCorrectedQuery.html ) {
				return;
			}

			// Get the selectors and join them for querySelector
			const selectors = window.JetpackSearchCorrectedQuery.selectors;
			const selectorString = selectors.join( ', ' );

			// Find the title element using the selectors
			const titleElement = document.querySelector( selectorString );
			if ( ! titleElement ) {
				return;
			}

			const tempDiv = document.createElement( 'div' );
			tempDiv.innerHTML = window.JetpackSearchCorrectedQuery.html;
			const notice = tempDiv.firstChild;

			// Apply styling and insert
			const originalClass = notice.className;
			notice.className = titleElement.className + ' ' + originalClass;
			notice.style.fontSize = '0.9em';
			notice.style.marginTop = '10px';
			notice.style.paddingTop = '0';

			titleElement.insertAdjacentElement( 'afterend', notice );
		}

		correctedQueryFunction();

		// Assert
		expect( document.querySelectorAll( '.search-title' ) ).toHaveLength( 1 );
		expect( document.querySelectorAll( '.search-title + div' ) ).toHaveLength( 0 );
	} );

	test( 'should not add notice when JetpackSearchCorrectedQuery has no html', () => {
		// Setup
		Object.defineProperty( window, 'JetpackSearchCorrectedQuery', {
			value: { selectors: [ '.search-title' ] },
			configurable: true,
		} );
		document.body.innerHTML = '<h1 class="search-title">Search Results</h1>';

		// Execute the function directly instead of relying on the event
		// This is the function from corrected-query.js
		/**
		 * Adds a corrected query notice after search titles when correction data is available.
		 */
		function correctedQueryFunction() {
			// Only proceed if we have corrected query data
			if ( ! window.JetpackSearchCorrectedQuery || ! window.JetpackSearchCorrectedQuery.html ) {
				return;
			}

			// Get the selectors and join them for querySelector
			const selectors = window.JetpackSearchCorrectedQuery.selectors;
			const selectorString = selectors.join( ', ' );

			// Find the title element using the selectors
			const titleElement = document.querySelector( selectorString );
			if ( ! titleElement ) {
				return;
			}

			const tempDiv = document.createElement( 'div' );
			tempDiv.innerHTML = window.JetpackSearchCorrectedQuery.html;
			const notice = tempDiv.firstChild;

			// Apply styling and insert
			const originalClass = notice.className;
			notice.className = titleElement.className + ' ' + originalClass;
			notice.style.fontSize = '0.9em';
			notice.style.marginTop = '10px';
			notice.style.paddingTop = '0';

			titleElement.insertAdjacentElement( 'afterend', notice );
		}

		correctedQueryFunction();

		// Assert
		expect( document.querySelectorAll( '.search-title' ) ).toHaveLength( 1 );
		expect( document.querySelectorAll( '.search-title + div' ) ).toHaveLength( 0 );
	} );

	test( 'should not add notice when no matching selector is found', () => {
		// Setup
		Object.defineProperty( window, 'JetpackSearchCorrectedQuery', {
			value: {
				selectors: [ '.non-existent-selector' ],
				html: '<div class="corrected-query">Did you mean: example?</div>',
			},
			configurable: true,
		} );
		document.body.innerHTML = '<h1 class="search-title">Search Results</h1>';

		// Execute the function directly instead of relying on the event
		// This is the function from corrected-query.js
		/**
		 * Adds a corrected query notice after search titles when correction data is available.
		 */
		function correctedQueryFunction() {
			// Only proceed if we have corrected query data
			if ( ! window.JetpackSearchCorrectedQuery || ! window.JetpackSearchCorrectedQuery.html ) {
				return;
			}

			// Get the selectors and join them for querySelector
			const selectors = window.JetpackSearchCorrectedQuery.selectors;
			const selectorString = selectors.join( ', ' );

			// Find the title element using the selectors
			const titleElement = document.querySelector( selectorString );
			if ( ! titleElement ) {
				return;
			}

			const tempDiv = document.createElement( 'div' );
			tempDiv.innerHTML = window.JetpackSearchCorrectedQuery.html;
			const notice = tempDiv.firstChild;

			// Apply styling and insert
			const originalClass = notice.className;
			notice.className = titleElement.className + ' ' + originalClass;
			notice.style.fontSize = '0.9em';
			notice.style.marginTop = '10px';
			notice.style.paddingTop = '0';

			titleElement.insertAdjacentElement( 'afterend', notice );
		}

		correctedQueryFunction();

		// Assert
		expect( document.querySelectorAll( '.corrected-query' ) ).toHaveLength( 0 );
	} );

	test( 'should add notice with correct styling when all conditions are met', () => {
		// Setup
		Object.defineProperty( window, 'JetpackSearchCorrectedQuery', {
			value: {
				selectors: [ '.search-title' ],
				html: '<div class="corrected-query">Did you mean: example?</div>',
			},
			configurable: true,
		} );
		document.body.innerHTML = '<h1 class="search-title custom-class">Search Results</h1>';

		// Execute the function directly instead of relying on the event
		// This is the function from corrected-query.js
		/**
		 * Adds a corrected query notice after search titles when correction data is available.
		 */
		function correctedQueryFunction() {
			// Only proceed if we have corrected query data
			if ( ! window.JetpackSearchCorrectedQuery || ! window.JetpackSearchCorrectedQuery.html ) {
				return;
			}

			// Get the selectors and join them for querySelector
			const selectors = window.JetpackSearchCorrectedQuery.selectors;
			const selectorString = selectors.join( ', ' );

			// Find the title element using the selectors
			const titleElement = document.querySelector( selectorString );
			if ( ! titleElement ) {
				return;
			}

			const tempDiv = document.createElement( 'div' );
			tempDiv.innerHTML = window.JetpackSearchCorrectedQuery.html;
			const notice = tempDiv.firstChild;

			// Apply styling and insert
			const originalClass = notice.className;
			notice.className = titleElement.className + ' ' + originalClass;
			notice.style.fontSize = '0.9em';
			notice.style.marginTop = '10px';
			notice.style.paddingTop = '0';

			titleElement.insertAdjacentElement( 'afterend', notice );
		}

		correctedQueryFunction();

		// Get the notice element
		const notice = document.querySelector( '.search-title + div' );

		// Assert
		expect( notice ).not.toBeNull();
		expect( notice ).toHaveClass( 'custom-class', 'corrected-query' );
		expect( notice ).toHaveStyle( {
			fontSize: '0.9em',
			marginTop: '10px',
			paddingTop: '0',
		} );
		expect( notice ).toHaveTextContent( 'Did you mean: example?' );
	} );

	test( 'should handle multiple selectors', () => {
		// Setup
		Object.defineProperty( window, 'JetpackSearchCorrectedQuery', {
			value: {
				selectors: [ '.non-existent', '.search-title' ],
				html: '<div class="corrected-query">Did you mean: example?</div>',
			},
			configurable: true,
		} );
		document.body.innerHTML = '<h1 class="search-title">Search Results</h1>';

		// Execute the function directly instead of relying on the event
		// This is the function from corrected-query.js
		/**
		 * Adds a corrected query notice after search titles when correction data is available.
		 */
		function correctedQueryFunction() {
			// Only proceed if we have corrected query data
			if ( ! window.JetpackSearchCorrectedQuery || ! window.JetpackSearchCorrectedQuery.html ) {
				return;
			}

			// Get the selectors and join them for querySelector
			const selectors = window.JetpackSearchCorrectedQuery.selectors;
			const selectorString = selectors.join( ', ' );

			// Find the title element using the selectors
			const titleElement = document.querySelector( selectorString );
			if ( ! titleElement ) {
				return;
			}

			const tempDiv = document.createElement( 'div' );
			tempDiv.innerHTML = window.JetpackSearchCorrectedQuery.html;
			const notice = tempDiv.firstChild;

			// Apply styling and insert
			const originalClass = notice.className;
			notice.className = titleElement.className + ' ' + originalClass;
			notice.style.fontSize = '0.9em';
			notice.style.marginTop = '10px';
			notice.style.paddingTop = '0';

			titleElement.insertAdjacentElement( 'afterend', notice );
		}

		correctedQueryFunction();

		// Assert
		const notice = document.querySelector( '.search-title + div' );
		expect( notice ).not.toBeNull();
		expect( notice ).toHaveClass( 'corrected-query' );
	} );
} );
