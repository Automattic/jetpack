( function () {
	let menuSelector, nonceInput;
	const initializedTables = new Set();

	const methods = {
		init: function ( table ) {
			let tbody = table.lastElementChild;
			while ( tbody && tbody.tagName !== 'TBODY' ) {
				tbody = tbody.previousElementSibling;
			}
			const row = tbody.querySelector( 'tr:first-child' ).cloneNode( true );

			table.dataset.form = table.closest( 'form' );
			table.dataset.tbody = tbody;
			table.dataset.row = row;
			table.dataset.currentRow = row;

			menuSelector = document.getElementById( 'nova-menu-tax' );
			nonceInput = document.getElementById( '_wpnonce' );

			table.addEventListener( 'keypress', function ( event ) {
				if ( event.which !== 13 ) return;

				event.preventDefault();
				if ( typeof FormData === 'function' ) {
					methods.submitRow.call( table );
				}
				methods.addRow.call( table );
			} );

			table.addEventListener( 'focusin', function ( event ) {
				if ( event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' ) {
					table.dataset.currentRow = event.target.closest( 'tr' );
				}
			} );

			initializedTables.add( table );
			return table;
		},

		destroy: function ( table ) {
			if ( this.observer ) {
				this.observer.disconnect();
			}
			table.removeEventListener( 'keypress', methods.keypressHandler );
			table.removeEventListener( 'focusin', methods.focusinHandler );
			initializedTables.delete( table );
			return table;
		},

		submitRow: function ( table ) {
			const submittedRow = table.dataset.currentRow;
			const currentInputs = submittedRow.querySelectorAll( 'input, textarea, select' );
			const form = document.querySelector( table.dataset.form );
			const allInputs = Array.from( form.querySelectorAll( 'input, textarea, select' ) );

			currentInputs.forEach( input => ( input.disabled = true ) );
			allInputs
				.filter( input => ! currentInputs.includes( input ) )
				.forEach( input => ( input.disabled = true ) );

			const partialFormData = new FormData( form );
			partialFormData.append( 'ajax', '1' );
			partialFormData.append( 'nova_menu_tax', menuSelector.value );
			partialFormData.append( '_wpnonce', nonceInput.value );

			fetch( '', {
				method: 'POST',
				body: partialFormData,
			} )
				.then( response => response.text() )
				.then( responseText => {
					submittedRow.innerHTML = responseText;
				} );

			allInputs.forEach( input => ( input.disabled = false ) );

			return table;
		},

		addRow: function ( table ) {
			const row = table.dataset.row.cloneNode( true );

			const tbody = table.dataset.tbody;
			tbody.appendChild( row );

			const firstInput = row.querySelector( 'input, textarea, select' );
			if ( firstInput ) firstInput.focus();

			return table;
		},

		clickAddRow: function ( table ) {
			let tbody = table.lastElementChild;

			while ( tbody && tbody.tagName !== 'TBODY' ) {
				tbody = tbody.previousElementSibling;
			}
			const row = tbody.querySelector( 'tr:first-child' ).cloneNode( true );

			row.querySelectorAll( 'input, textarea' ).forEach( input => {
				input.value = '';
			} );

			tbody.appendChild( row );
		},
	};

	const observeTableRemoval = function ( list ) {
		const observer = new MutationObserver( mutations => {
			mutations.forEach( mutation => {
				mutation.removedNodes.forEach( node => {
					if ( node.matches && node.matches( '.many-items-table' ) ) {
						methods.destroy( node );
					}
				} );
			} );
		} );

		observer.observe( list, { childList: true, subtree: true } );
	};

	// Initialization for many-items-table
	document.addEventListener( 'focusin', event => {
		const table = event.target.closest( '.many-items-table' );
		if ( table && ! initializedTables.has( table ) ) {
			methods.init( table );
		}
	} );

	document.addEventListener( 'click', event => {
		if ( event.target.matches( 'a.nova-new-row' ) ) {
			const table = event.target.closest( '.many-items-table' );
			if ( table ) {
				event.preventDefault();
				methods.clickAddRow( table );
			}
		}
	} );
	const list = document.querySelector( '#the-list' ); // Scope to the specific table
	if ( list ) {
		observeTableRemoval( list );
	}
} )();
