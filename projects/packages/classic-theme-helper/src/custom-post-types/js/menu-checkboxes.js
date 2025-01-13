( function () {
	const NovaCheckBoxes = {
		inputs: null,
		popInputs: null,

		initialize: function () {
			// Get all checkboxes in the "nova_menuchecklist-pop"
			NovaCheckBoxes.popInputs = document.querySelectorAll(
				'#nova_menuchecklist-pop input[type="checkbox"]'
			);

			// Get all checkboxes in the "nova_menuchecklist" and add event listeners
			NovaCheckBoxes.inputs = document.querySelectorAll(
				'#nova_menuchecklist input[type="checkbox"]'
			);
			NovaCheckBoxes.inputs.forEach( input => {
				input.addEventListener( 'change', NovaCheckBoxes.checkOne );
				input.addEventListener( 'change', NovaCheckBoxes.syncPop );
			} );

			// If no checkboxes are checked, check the first one
			if ( ! NovaCheckBoxes.isChecked() ) {
				NovaCheckBoxes.checkFirst();
			}

			// Sync the state of the "pop" inputs
			NovaCheckBoxes.syncPop();
		},

		syncPop: function () {
			NovaCheckBoxes.popInputs.forEach( popInput => {
				const linkedInput = document.querySelector( `#in-nova_menu-${ popInput.value }` );
				popInput.checked = linkedInput ? linkedInput.checked : false;
			} );
		},

		isChecked: function () {
			return Array.from( NovaCheckBoxes.inputs ).some( input => input.checked );
		},

		checkFirst: function () {
			const firstInput = NovaCheckBoxes.inputs[ 0 ];
			if ( firstInput ) {
				firstInput.checked = true;
			}
		},

		checkOne: function () {
			const currentInput = this;

			// If the current checkbox is checked, uncheck all other checkboxes
			if ( currentInput.checked ) {
				NovaCheckBoxes.inputs.forEach( input => {
					if ( input !== currentInput ) {
						input.checked = false;
					}
				} );
				return;
			}
			const checklist = document.querySelector( '#nova_menuchecklist' );

			// If at least one checkbox is still checked, uncheck the current one
			if ( checklist.querySelectorAll( 'input[type="checkbox"]:checked' ).length > 0 ) {
				currentInput.checked = false;
				return;
			}

			// Otherwise, check the first checkbox
			NovaCheckBoxes.checkFirst();
		},
	};

	// Initialize when the DOM is fully loaded
	document.addEventListener( 'DOMContentLoaded', NovaCheckBoxes.initialize );
} )();
