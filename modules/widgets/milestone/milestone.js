/* global MilestoneConfig */

var Milestone = ( function( $ ) {
	var Milestone = function ( args ) {
		var num,
			labels = MilestoneConfig.labels;

		this.id = args.id;
		this.diff = args.diff;
		this.message = args.message;
		this.widget = $( '#' + this.id );
		this.widgetContent = this.widget.find( '.milestone-content' );

		this.timer = function() {
			this.diff = this.diff - 1;

			if ( 63113852 < this.diff ) { // more than 2 years - show in years, one decimal point
				num = ( this.diff / 60 / 60 / 24 / 365 ).toFixed( 1 );
				if ( 0 === num.charAt( num.length - 1 ) ) {
					num = Math.floor( num );
				}
				this.number = num;
				this.label = labels.years;
			} else if ( 7775999 < this.diff ) { // fewer than 2 years - show in months
				this.number = Math.floor( this.diff / 60 / 60 / 24 / 30 );
				this.label = ( 1 === this.number ) ? labels.month : labels.months;
			} else if ( 86399 < this.diff ) { // fewer than 3 months - show in days
				this.number = Math.floor( this.diff / 60 / 60 / 24 ) + 1;
				this.label = ( 1 === this.number ) ? labels.day : labels.days;
			} else if ( 3599 < this.diff ) { // less than 1 day - show in hours
				this.number = Math.floor( this.diff / 60 / 60 );
				this.label = ( 1 === this.number ) ? labels.hour : labels.hours;
			} else if ( 59 < this.diff ) { // less than 1 hour - show in minutes
				this.number = Math.floor( this.diff / 60 ) + 1;
				this.label = ( 1 === this.number ) ? labels.minute : labels.minutes;
			} else { // less than 1 minute - show in seconds
				this.number = this.diff;
				this.label = ( 1 === this.number ) ? labels.second : labels.seconds;
			}

			this.widget.find( '.difference' ).html( this.number );
			this.widget.find( '.label' ).html( this.label );

			if ( 1 > this.diff ) {
				this.widget.find( '.milestone-countdown' ).replaceWith( '<div class="milestone-message">' + this.message + '</div>' );
			} else {
				var instance = this;
				setTimeout( function() { instance.timer(); }, 1000 );
			}
		};

		this.timer();
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
