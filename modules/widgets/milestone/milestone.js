/* global MilestoneConfig */

var Milestone = ( function( $ ) {
	var Milestone = function ( args ) {
		var $widget = $( '#' + args.id ),
			id = args.id,
			refresh = args.refresh * 1000;

		this.timer = function() {
			var instance = this;

			$.ajax( {
				url: MilestoneConfig.api_root + 'jetpack/v4/widgets/' + id,
				success: function( result ) {
					$widget.find( '.milestone-countdown' ).replaceWith( result.message );
					refresh = result.refresh * 1000;

					if ( ! refresh ) {
						return;
					}

					setTimeout(
						function() {
							instance.timer();
						},
						refresh
					);
				}
			} );

		};

		if ( refresh > 0 ) {
			this.timer();
		}
	};
	return function ( args ) {
		return new Milestone( args );
	};
} )( jQuery );

( function() {
	var i, MilestoneInstances = {};

	if ( typeof( MilestoneConfig ) === 'undefined' ) {
		return;
	}

	for ( i = 0; i < MilestoneConfig.instances.length; i++ ) {
		MilestoneInstances[i] = new Milestone( MilestoneConfig.instances[i] );
	}
} )();
