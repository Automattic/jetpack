/* global MilestoneConfig */

var Milestone = ( function( $ ) {
	var Milestone = function ( args ) {
		var num,
			labels = MilestoneConfig.labels;

		this.id = args.id;
		this.diff = args.diff;
		this.message = args.message;
		this.unit = args.unit;
		this.type = args.type;
		this.widget = $( '#' + this.id );
		this.widgetContent = this.widget.find( '.milestone-content' );
		this.secondsPerMonth = 2628000;
		this.secondsPerDay = 86400;
		this.secondsPerHour = 3600;
		this.secondsPerMinute = 60;

		this.isCountingDown = function() {
			return ! this.type || 'until' === this.type;
		};

		this.getYears = function() {
			num = ( this.diff / 60 / 60 / 24 / 365 ).toFixed( 1 );

			if ( 0 === num.charAt( num.length - 1 ) ) {
				num = Math.floor( num );
			}

			return num;
		};

		this.getYearsLabel = function() {
			if ( this.isCountingDown() ) {
				return ( 1 === this.number ) ? labels.yearToGo : labels.yearsToGo;
			}

			return ( 1 === this.number ) ? labels.yearAgo : labels.yearsAgo;
		};

		this.getMonths = function() {
			return Math.floor( this.diff / 60 / 60 / 24 / 30 );
		};

		this.getMonthsLabel = function() {
			if ( this.isCountingDown() ) {
				return ( 1 === this.number ) ? labels.monthToGo : labels.monthsToGo;
			}

			return ( 1 === this.number ) ? labels.monthAgo : labels.monthsAgo;
		};

		this.getDays = function() {
			return Math.floor( this.diff / 60 / 60 / 24 ) + 1;
		};

		this.getDaysLabel = function() {
			if ( this.isCountingDown() ) {
				return ( 1 === this.number ) ? labels.dayToGo : labels.daysToGo;
			}

			return ( 1 === this.number ) ? labels.dayAgo : labels.daysAgo;
		};

		this.getHours = function() {
			return Math.floor( this.diff / 60 / 60 );
		};

		this.getHoursLabel = function() {
			if ( this.isCountingDown() ) {
				return ( 1 === this.number ) ? labels.hourToGo : labels.hoursToGo;
			}

			return ( 1 === this.number ) ? labels.hourAgo : labels.hoursAgo;
		};

		this.getMinutes = function() {
			return Math.floor( this.diff / 60 ) + 1;
		};

		this.getMinutesLabel = function() {
			if ( this.isCountingDown() ) {
				return ( 1 === this.number ) ? labels.minuteToGo : labels.minutesToGo;
			}

			return ( 1 === this.number ) ? labels.minuteAgo : labels.minutesAgo;
		};

		this.getSeconds = function() {
			return this.diff;
		};

		this.getSecondsLabel = function() {
			if ( this.isCountingDown() ) {
				return ( 1 === this.number ) ? labels.secondToGo : labels.secondsToGo;
			}

			return ( 1 === this.number ) ? labels.secondAgo : labels.secondsAgo;
		};

		this.timer = function() {
			if ( this.isCountingDown() ) {
				this.diff = this.diff - 1;
			} else {
				this.diff = this.diff + 1;
			}

			switch ( this.unit ) {
				case 'months':
					if ( this.diff >= this.secondsPerMonth ) { // more than 1 month - show in months
						this.number = this.getMonths();
						this.label = this.getMonthsLabel();
					} else if ( this.diff >= this.secondsPerDay - 1 ) { // less than 1 month - show in days
						this.number = this.getDays();
						this.label = this.getDaysLabel();
					} else if ( this.diff >= this.secondsPerHour - 1 ) { // less than 1 day - show in hours
						this.number = this.getHours();
						this.label = this.getHoursLabel();
					} else if ( this.diff >= this.secondsPerMinute - 1 ) { // less than 1 hour - show in minutes
						this.number = this.getMinutes();
						this.label = this.getMinutesLabel();
					} else { // less than 1 minute - show in seconds
						this.number = this.getSeconds();
						this.label = this.getSecondsLabel();
					}

					break;
				case 'days':
					if ( this.diff >= this.secondsPerDay - 1 ) { // more than 1 day - show in days
						this.number = this.getDays();
						this.label = this.getDaysLabel();
					} else if ( this.diff >= this.secondsPerHour - 1 ) { // less than 1 day - show in hours
						this.number = this.getHours();
						this.label = this.getHoursLabel();
					} else if ( this.diff >= this.secondsPerMinute - 1 ) { // less than 1 hour - show in minutes
						this.number = this.getMinutes();
						this.label = this.getMinutesLabel();
					} else { // less than 1 minute - show in seconds
						this.number = this.getSeconds();
						this.label = this.getSecondsLabel();
					}

					break;
				case 'hours':
					if ( this.diff >= this.secondsPerHour - 1 ) { // more than 1 hour - show in hours
						this.number = this.getHours();
						this.label = this.getHoursLabel();
					} else if ( this.diff >= this.secondsPerMinute - 1 ) { // less than 1 hour - show in minutes
						this.number = this.getMinutes();
						this.label = this.getMinutesLabel();
					} else { // less than 1 minute - show in seconds
						this.number = this.getSeconds();
						this.label = this.getSecondsLabel();
					}

					break;
				default:
					if ( this.diff >= 63113852 ) { // more than 2 years - show in years, one decimal point
						this.number = this.getYears();
						this.label = this.getYearsLabel();
					} else if ( this.diff >= 7775999 ) { // fewer than 2 years - show in months
						this.number = this.getMonths();
						this.label = this.getMonthsLabel();
					} else if ( this.diff >= this.secondsPerDay - 1 ) { // fewer than 3 months - show in days
						this.number = this.getDays();
						this.label = this.getDaysLabel();
					} else if ( this.diff >= this.secondsPerHour - 1 ) { // less than 1 day - show in hours
						this.number = this.getHours();
						this.label = this.getHoursLabel();
					} else if ( this.diff >= this.secondsPerMinute - 1 ) { // less than 1 hour - show in minutes
						this.number = this.getMinutes();
						this.label = this.getMinutesLabel();
					} else { // less than 1 minute - show in seconds
						this.number = this.getSeconds();
						this.label = this.getSecondsLabel();
					}
			}

			this.widget.find( '.difference' ).html( this.number );
			this.widget.find( '.label' ).html( this.label );

			// Milestone has been reached.
			if ( 1 > this.diff ) {
				// Message is only applicable when counting down.
				if ( ! this.isCountingDown() ) {
					this.widget.find( '.milestone-countdown' ).remove();
				} else {
					this.widget.find( '.milestone-countdown' ).replaceWith( '<div class="milestone-message">' + this.message + '</div>' );
				}
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
