/* jshint onevar: false, smarttabs: true, devel: true */

( function( $ ) {
	var NovaCheckBoxes = {
		inputs: null,
		popInputs: null,

		initialize: function() {
			NovaCheckBoxes.popInputs = $( '#nova_menuchecklist-pop' ).find( ':checkbox' );

			NovaCheckBoxes.inputs = $( '#nova_menuchecklist' )
				.find( ':checkbox' )
				.change( NovaCheckBoxes.checkOne )
				.change( NovaCheckBoxes.syncPop );

			if ( ! NovaCheckBoxes.isChecked() ) {
				NovaCheckBoxes.checkFirst();
			}

			NovaCheckBoxes.syncPop();
		},

		syncPop: function() {
			NovaCheckBoxes.popInputs.each( function() {
				var $this = $( this );
				$this.prop( 'checked', $( '#in-nova_menu-' + $this.val() ).is( ':checked' ) );
			} );
		},

		isChecked: function() {
			return NovaCheckBoxes.inputs.is( ':checked' );
		},

		checkFirst: function() {
			NovaCheckBoxes.inputs.first().prop( 'checked', true );
		},

		checkOne: function(/*event*/) {
			if ( $( this ).is( ':checked' ) ) {
				return NovaCheckBoxes.inputs.not( this ).prop( 'checked', false );
			} else {
				if (
					$( this )
						.closest( '#nova_menuchecklist' )
						.find( ':checked' ).length > 0
				) {
					return $( this ).prop( 'checked', false );
				}
				return NovaCheckBoxes.checkFirst();
			}
		},
	};

	$( NovaCheckBoxes.initialize );
} )( jQuery );
