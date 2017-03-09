<?php

/**
 * Gets and renders iCal feeds for the Upcoming Events widget and shortcode
 */

class iCalendarReader {

	public $todo_count = 0;
	public $event_count = 0;
	public $cal = array();
	public $_lastKeyWord = '';
	public $timezone = null;

	/**
	 * Class constructor
	 *
	 * @return void
	 */
	public function __construct() {}

	/**
	 * Return an array of events
	 *
	 * @param string $url (default: '')
	 * @return array | false on failure
	 */
	public function get_events( $url = '', $count = 5 ) {
		$count = (int) $count;
		$transient_id = 'icalendar_vcal_' . md5( $url ) . '_' . $count;

		$vcal = get_transient( $transient_id );

		if ( ! empty( $vcal ) ) {
			if ( isset( $vcal['TIMEZONE'] ) )
				$this->timezone = $this->timezone_from_string( $vcal['TIMEZONE'] );

			if ( isset( $vcal['VEVENT'] ) ) {
				$vevent = $vcal['VEVENT'];

				if ( $count > 0 )
					$vevent = array_slice( $vevent, 0, $count );

				$this->cal['VEVENT'] = $vevent;

				return $this->cal['VEVENT'];
			}
		}

		if ( ! $this->parse( $url ) )
			return false;

		$vcal = array();

		if ( $this->timezone ) {
			$vcal['TIMEZONE'] = $this->timezone->getName();
		} else {
			$this->timezone = $this->timezone_from_string( '' );
		}

		if ( ! empty( $this->cal['VEVENT'] ) ) {
			$vevent = $this->cal['VEVENT'];

			// check for recurring events
			// $vevent = $this->add_recurring_events( $vevent );

			// remove before caching - no sense in hanging onto the past
			$vevent = $this->filter_past_and_recurring_events( $vevent );

			// order by soonest start date
			$vevent = $this->sort_by_recent( $vevent );

			$vcal['VEVENT'] = $vevent;
		}

		set_transient( $transient_id, $vcal, HOUR_IN_SECONDS );

		if ( !isset( $vcal['VEVENT'] ) )
			return false;

		if ( $count > 0 )
			return array_slice( $vcal['VEVENT'], 0, $count );

		return $vcal['VEVENT'];
	}

	function apply_timezone_offset( $events ) {
		if ( ! $events ) {
			return $events;
		}

		// get timezone offset from the timezone name.
		$timezone_name = get_option( 'timezone_string' );
		if ( $timezone_name ) {
			$timezone = new DateTimeZone( $timezone_name );
		} else {
			// If the timezone isn't set then the GMT offset must be set.
			// generate a DateInterval object from the timezone offset
			$gmt_offset = get_option( 'gmt_offset' ) * HOUR_IN_MINUTES;
			$timezone_offset_interval = date_interval_create_from_date_string( "{$gmt_offset} minutes" );
			$timezone = new DateTimeZone( 'UTC' );
		}

		$offsetted_events = array();

		foreach ( $events as $event ) {
			// Don't handle all-day events
			if ( 8 < strlen( $event['DTSTART'] ) ) {
				$start_time = preg_replace( '/Z$/', '', $event['DTSTART'] );
				$start_time = new DateTime( $start_time, $this->timezone );
				$start_time->setTimeZone( $timezone );

				$end_time = preg_replace( '/Z$/', '', $event['DTEND'] );
				$end_time = new DateTime( $end_time, $this->timezone );
				$end_time->setTimeZone( $timezone );
				
				if ( $timezone_offset_interval ) {
					$start_time->add( $timezone_offset_interval );
					$end_time->add( $timezone_offset_interval );
				}

				$event['DTSTART'] = $start_time->format( 'YmdHis\Z' );
				$event['DTEND'] = $end_time->format( 'YmdHis\Z' );
			}

			$offsetted_events[] = $event;
		}

		return $offsetted_events;
	}

	protected function filter_past_and_recurring_events( $events ) {
		$upcoming = array();
		$set_recurring_events = array();
		$recurrences = array();
		/**
		 * This filter allows any time to be passed in for testing or changing timezones, etc...
		 *
		 * @module widgets
		 * 
		 * @since 3.4.0
		 *
		 * @param object time() A time object.
		 */
		$current = apply_filters( 'ical_get_current_time', time() );

		foreach ( $events as $event ) {

			$date_from_ics = strtotime( $event['DTSTART'] );
			if ( isset( $event['DTEND'] ) ) {
				$duration = strtotime( $event['DTEND'] ) - strtotime( $event['DTSTART'] );
			} else {
				$duration = 0;
			}

			if ( isset( $event['RRULE'] ) && $this->timezone->getName() && 8 != strlen( $event['DTSTART'] ) ) {
				try {
					$adjusted_time = new DateTime( $event['DTSTART'], new DateTimeZone('UTC') );
					$adjusted_time->setTimeZone( new DateTimeZone( $this->timezone->getName() ) );
					$event['DTSTART'] = $adjusted_time->format('Ymd\THis');
					$date_from_ics = strtotime( $event['DTSTART'] );

					$event['DTEND'] = date( 'Ymd\THis', strtotime( $event['DTSTART'] ) + $duration );
				} catch ( Exception $e ) {
					// Invalid argument to DateTime
				}

				if ( isset( $event['EXDATE'] ) ) {
					$exdates = array();
					foreach ( (array) $event['EXDATE'] as $exdate ) {
						try {
							$adjusted_time = new DateTime( $exdate, new DateTimeZone('UTC') );
							$adjusted_time->setTimeZone( new DateTimeZone( $this->timezone->getName() ) );
							if ( 8 == strlen( $event['DTSTART'] ) ) {
								$exdates[] = $adjusted_time->format( 'Ymd' );
							} else {
								$exdates[] = $adjusted_time->format( 'Ymd\THis' );
							}
						} catch ( Exception $e ) {
							// Invalid argument to DateTime
						}
					}
					$event['EXDATE'] = $exdates;
				} else {
					$event['EXDATE'] = array();
				}
			}

			if ( ! isset( $event['DTSTART'] ) ) {
				continue;
			}

			// Process events with RRULE before other events
			$rrule = isset( $event['RRULE'] ) ? $event['RRULE'] : false ;
			$uid = $event['UID'];

			if ( $rrule && ! in_array( $uid, $set_recurring_events ) ) {

				// Break down the RRULE into digestible chunks
				$rrule_array = array();

				foreach ( explode( ";", $event['RRULE'] ) as $rline ) {
					list( $rkey, $rvalue ) = explode( "=", $rline, 2 );
					$rrule_array[$rkey] = $rvalue;
				}

				$interval = ( isset( $rrule_array['INTERVAL'] ) ) ? $rrule_array['INTERVAL'] : 1;
				$rrule_count = ( isset( $rrule_array['COUNT'] ) ) ? $rrule_array['COUNT'] : 0;
				$until = ( isset( $rrule_array['UNTIL'] ) ) ? strtotime( $rrule_array['UNTIL'] ) : strtotime( '+1 year', $current );

				// Used to bound event checks
				$echo_limit = 10;
				$noop = false;

				// Set bydays for the event
				$weekdays = array( 'SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA' );
				$bydays = $weekdays;

				// Calculate a recent start date for incrementing depending on the frequency and interval
				switch ( $rrule_array['FREQ'] ) {

					case 'DAILY':
						$frequency = 'day';
						$echo_limit = 10;

						if ( $date_from_ics >= $current ) {
							$recurring_event_date_start = date( 'Ymd\THis', strtotime( $event['DTSTART'] ) );
						} else {
							// Interval and count
							$catchup = floor( ( $current - strtotime( $event['DTSTART'] ) ) / ( $interval * DAY_IN_SECONDS ) );
							if ( $rrule_count && $catchup > 0 ) {
								if ( $catchup < $rrule_count ) {
									$rrule_count = $rrule_count - $catchup;
									$recurring_event_date_start = date( 'Ymd', strtotime( '+ ' . ( $interval * $catchup ) . ' days', strtotime( $event['DTSTART'] ) ) ) . date( '\THis', strtotime( $event['DTSTART'] ) );
								} else {
									$noop = true;
								}
							} else {
								$recurring_event_date_start = date( 'Ymd', strtotime( '+ ' . ( $interval * $catchup ) . ' days', strtotime( $event['DTSTART'] ) ) ) . date( '\THis', strtotime( $event['DTSTART'] ) );
							}
						}
						break;

					case 'WEEKLY':
						$frequency = 'week';
						$echo_limit = 4;

						// BYDAY exception to current date
						$day = false;
						if ( ! isset( $rrule_array['BYDAY'] ) ) {
							$day = $rrule_array['BYDAY'] = strtoupper( substr( date( 'D', strtotime( $event['DTSTART'] ) ), 0, 2 ) );
						}
						$bydays = explode( ',', $rrule_array['BYDAY'] );

						if ( $date_from_ics >= $current ) {
							$recurring_event_date_start = date( 'Ymd\THis', strtotime( $event['DTSTART'] ) );
						} else {
							// Interval and count
							$catchup = floor( ( $current - strtotime( $event['DTSTART'] ) ) / ( $interval * WEEK_IN_SECONDS ) );
							if ( $rrule_count && $catchup > 0 ) {
								if ( ( $catchup * count( $bydays ) ) < $rrule_count ) {
									$rrule_count = $rrule_count - ( $catchup * count( $bydays ) ); // Estimate current event count
									$recurring_event_date_start = date( 'Ymd', strtotime( '+ ' . ( $interval * $catchup ) . ' weeks', strtotime( $event['DTSTART'] ) ) ) . date( '\THis', strtotime( $event['DTSTART'] ) );
								} else {
									$noop = true;
								}
							} else {
								$recurring_event_date_start = date( 'Ymd', strtotime( '+ ' . ( $interval * $catchup ) . ' weeks', strtotime( $event['DTSTART'] ) ) ) . date( '\THis', strtotime( $event['DTSTART'] ) );
							}
						}

						// Set to Sunday start
						if ( ! $noop && 'SU' !== strtoupper( substr( date( 'D', strtotime( $recurring_event_date_start ) ), 0, 2 ) ) ) {
							$recurring_event_date_start = date( 'Ymd', strtotime( "last Sunday", strtotime( $recurring_event_date_start ) ) ) . date( '\THis', strtotime( $event['DTSTART'] ) );
						}
						break;

					case 'MONTHLY':
						$frequency = 'month';
						$echo_limit = 1;

						if ( $date_from_ics >= $current ) {
							$recurring_event_date_start = date( 'Ymd\THis', strtotime( $event['DTSTART'] ) );
						} else {
							// Describe the date in the month
							if ( isset( $rrule_array['BYDAY'] ) ) {
								$day_number = substr( $rrule_array['BYDAY'], 0, 1 );
								$week_day = substr( $rrule_array['BYDAY'], 1 );
								$day_cardinals = array( 1 => 'first', 2 => 'second', 3 => 'third', 4 => 'fourth', 5 => 'fifth' );
								$weekdays = array( 'SU' => 'Sunday', 'MO' => 'Monday', 'TU' => 'Tuesday', 'WE' => 'Wednesday', 'TH' => 'Thursday', 'FR' => 'Friday', 'SA' => 'Saturday' );
								$event_date_desc = "{$day_cardinals[$day_number]} {$weekdays[$week_day]} of ";
							} else {
								$event_date_desc = date( 'd ', strtotime( $event['DTSTART'] ) );
							}

							// Interval only
							if ( $interval > 1 ) {
								$catchup = 0;
								$maybe = strtotime( $event['DTSTART'] );
								while ( $maybe < $current ) {
									$maybe = strtotime( '+ ' . ( $interval * $catchup ) . ' months', strtotime( $event['DTSTART'] ) );
									$catchup++;
								}
								$recurring_event_date_start = date( 'Ymd', strtotime( $event_date_desc . date( 'F Y', strtotime( '+ ' . ( $interval * ( $catchup - 1 ) ) . ' months', strtotime( $event['DTSTART'] ) ) ) ) ) . date( '\THis', strtotime( $event['DTSTART'] ) );
							} else {
								$recurring_event_date_start = date( 'Ymd', strtotime( $event_date_desc . date( 'F Y', $current ) ) ) . date( '\THis', strtotime( $event['DTSTART'] ) );
							}

							// Add one interval if necessary
							if ( strtotime( $recurring_event_date_start ) < $current ) {
								if ( $interval > 1 ) {
									$recurring_event_date_start = date( 'Ymd', strtotime( $event_date_desc . date( 'F Y', strtotime( '+ ' . ( $interval * $catchup ) . ' months', strtotime( $event['DTSTART'] ) ) ) ) ) . date( '\THis', strtotime( $event['DTSTART'] ) );
								} else {
									try {
										$adjustment = new DateTime( date( 'Y-m-d', $current ) );
										$adjustment->modify( 'first day of next month' );
										$recurring_event_date_start = date( 'Ymd', strtotime( $event_date_desc . $adjustment->format( 'F Y' ) ) ) . date( '\THis', strtotime( $event['DTSTART'] ) );
									} catch ( Exception $e ) {
										// Invalid argument to DateTime
									}
								}
							}
						}
						break;

					case 'YEARLY':
						$frequency = 'year';
						$echo_limit = 1;

						if ( $date_from_ics >= $current ) {
							$recurring_event_date_start = date( "Ymd\THis", strtotime( $event['DTSTART'] ) );
						} else {
							$recurring_event_date_start = date( 'Y', $current ) . date( "md\THis", strtotime( $event['DTSTART'] ) );
							if ( strtotime( $recurring_event_date_start ) < $current ) {
								try {
									$next = new DateTime( date( 'Y-m-d', $current ) );
									$next->modify( 'first day of next year' );
									$recurring_event_date_start = $next->format( 'Y' ) . date ( 'md\THis', strtotime( $event['DTSTART'] ) );
								} catch ( Exception $e ) {
									// Invalid argument to DateTime
								}
							}
						}
						break;

					default:
						$frequency = false;
				}

				if ( $frequency !== false && ! $noop ) {
					$count_counter = 1;

					// If no COUNT limit, go to 10
					if ( empty( $rrule_count ) ) {
						$rrule_count = 10;
					}

					// Set up EXDATE handling for the event
					$exdates = ( isset( $event['EXDATE'] ) ) ? $event['EXDATE'] : array();

					for ( $i = 1; $i <= $echo_limit; $i++ ) {

						// Weeks need a daily loop and must check for inclusion in BYDAYS
						if ( 'week' == $frequency ) {
							$byday_event_date_start = strtotime( $recurring_event_date_start );

							foreach ( $weekdays as $day ) {

								$event_start_timestamp = $byday_event_date_start;
								$start_time = date( 'His', $event_start_timestamp );
								$event_end_timestamp = $event_start_timestamp + $duration;
								$end_time = date( 'His', $event_end_timestamp );
								if ( 8 == strlen( $event['DTSTART'] ) ) {
									$exdate_compare = date( 'Ymd', $event_start_timestamp );
								} else {
									$exdate_compare = date( 'Ymd\THis', $event_start_timestamp );
								}

								if ( in_array( $day, $bydays ) && $event_end_timestamp > $current && $event_start_timestamp < $until && $count_counter <= $rrule_count && $event_start_timestamp >= $date_from_ics && ! in_array( $exdate_compare, $exdates ) ) {
									if ( 8 == strlen( $event['DTSTART'] ) ) {
										$event['DTSTART'] = date( 'Ymd', $event_start_timestamp );
										$event['DTEND'] = date( 'Ymd', $event_end_timestamp );
									} else {
										$event['DTSTART'] = date( 'Ymd\THis', $event_start_timestamp );
										$event['DTEND'] = date( 'Ymd\THis', $event_end_timestamp );
									}
									if ( $this->timezone->getName() && 8 != strlen( $event['DTSTART'] ) ) {
										try {
											$adjusted_time = new DateTime( $event['DTSTART'], new DateTimeZone( $this->timezone->getName() ) );
											$adjusted_time->setTimeZone( new DateTimeZone( 'UTC' ) );
											$event['DTSTART'] = $adjusted_time->format('Ymd\THis');

											$event['DTEND'] = date( 'Ymd\THis', strtotime( $event['DTSTART'] ) + $duration );
										} catch ( Exception $e ) {
											// Invalid argument to DateTime
										}
									}
									$upcoming[] = $event;
									$count_counter++;
								}

								// Move forward one day
								$byday_event_date_start = strtotime( date( 'Ymd\T', strtotime( '+ 1 day', $event_start_timestamp ) ) . $start_time );
							}

							// Restore first event timestamp
							$event_start_timestamp = strtotime( $recurring_event_date_start );

						} else {

							$event_start_timestamp = strtotime( $recurring_event_date_start );
							$start_time = date( 'His', $event_start_timestamp );
							$event_end_timestamp = $event_start_timestamp + $duration;
							$end_time = date( 'His', $event_end_timestamp );
							if ( 8 == strlen( $event['DTSTART'] ) ) {
								$exdate_compare = date( 'Ymd', $event_start_timestamp );
							} else {
								$exdate_compare = date( 'Ymd\THis', $event_start_timestamp );
							}

							if ( $event_end_timestamp > $current && $event_start_timestamp < $until && $count_counter <= $rrule_count && $event_start_timestamp >= $date_from_ics && ! in_array( $exdate_compare, $exdates ) ) {
								if ( 8 == strlen( $event['DTSTART'] ) ) {
									$event['DTSTART'] = date( 'Ymd', $event_start_timestamp );
									$event['DTEND'] = date( 'Ymd', $event_end_timestamp );
								} else {
									$event['DTSTART'] = date( 'Ymd\T', $event_start_timestamp ) . $start_time;
									$event['DTEND'] = date( 'Ymd\T', $event_end_timestamp ) . $end_time;
								}
								if ( $this->timezone->getName() && 8 != strlen( $event['DTSTART'] ) ) {
									try {
										$adjusted_time = new DateTime( $event['DTSTART'], new DateTimeZone( $this->timezone->getName() ) );
										$adjusted_time->setTimeZone( new DateTimeZone( 'UTC' ) );
										$event['DTSTART'] = $adjusted_time->format('Ymd\THis');

										$event['DTEND'] = date( 'Ymd\THis', strtotime( $event['DTSTART'] ) + $duration );
									} catch ( Exception $e ) {
										// Invalid argument to DateTime
									}
								}
								$upcoming[] = $event;
								$count_counter++;
							}
						}

						// Set up next interval and reset $event['DTSTART'] and $event['DTEND'], keeping timestamps intact
						$next_start_timestamp = strtotime( "+ {$interval} {$frequency}s", $event_start_timestamp );
						if ( 8 == strlen( $event['DTSTART'] ) ) {
							$event['DTSTART'] = date( 'Ymd', $next_start_timestamp );
							$event['DTEND'] = date( 'Ymd', strtotime( $event['DTSTART'] ) + $duration );
						} else {
							$event['DTSTART'] = date( 'Ymd\THis', $next_start_timestamp );
							$event['DTEND'] = date( 'Ymd\THis', strtotime( $event['DTSTART'] ) + $duration );
						}

						// Move recurring event date forward
						$recurring_event_date_start = $event['DTSTART'];
					}
					$set_recurring_events[] = $uid;

				}

			} else {
				// Process normal events
				if ( strtotime( isset( $event['DTEND'] ) ? $event['DTEND'] : $event['DTSTART'] ) >= $current ) {
					$upcoming[] = $event;
				}
			}
		}
		return $upcoming;
	}

	/**
	 * Parse events from an iCalendar feed
	 *
	 * @param string $url (default: '')
	 * @return array | false on failure
	 */
	public function parse( $url = '' ) {
		$cache_group = 'icalendar_reader_parse';
		$disable_get_key = 'disable:' . md5( $url );

		// Check to see if previous attempts have failed
		if ( false !== wp_cache_get( $disable_get_key, $cache_group ) )
			return false;

		// rewrite webcal: URI schem to HTTP
		$url = preg_replace('/^webcal/', 'http', $url );
		// try to fetch
		$r = wp_remote_get( $url, array( 'timeout' => 3, 'sslverify' => false ) );
		if ( 200 !== wp_remote_retrieve_response_code( $r ) ) {
			// We were unable to fetch any content, so don't try again for another 60 seconds
			wp_cache_set( $disable_get_key, 1, $cache_group, 60 );
			return false;
		}

		$body = wp_remote_retrieve_body( $r );
		if ( empty( $body ) )
			return false;

		$body = str_replace( "\r\n", "\n", $body );
		$lines = preg_split( "/\n(?=[A-Z])/", $body );

		if ( empty( $lines ) )
			return false;

		if ( false === stristr( $lines[0], 'BEGIN:VCALENDAR' ) )
			return false;

		foreach ( $lines as $line ) {
			$add  = $this->key_value_from_string( $line );
			if ( ! $add ) {
				$this->add_component( $type, false, $line );
				continue;
			}
			list( $keyword, $value ) = $add;

			switch ( $keyword ) {
				case 'BEGIN':
				case 'END':
					switch ( $line ) {
						case 'BEGIN:VTODO':
							$this->todo_count++;
							$type = 'VTODO';
							break;
						case 'BEGIN:VEVENT':
							$this->event_count++;
							$type = 'VEVENT';
							break;
						case 'BEGIN:VCALENDAR':
						case 'BEGIN:DAYLIGHT':
						case 'BEGIN:VTIMEZONE':
						case 'BEGIN:STANDARD':
							$type = $value;
							break;
						case 'END:VTODO':
						case 'END:VEVENT':
						case 'END:VCALENDAR':
						case 'END:DAYLIGHT':
						case 'END:VTIMEZONE':
						case 'END:STANDARD':
							$type = 'VCALENDAR';
							break;
					}
					break;
				case 'TZID':
					if ( 'VTIMEZONE' == $type && ! $this->timezone )
						$this->timezone = $this->timezone_from_string( $value );
					break;
				case 'X-WR-TIMEZONE':
					if ( ! $this->timezone )
						$this->timezone = $this->timezone_from_string( $value );
					break;
				default:
					$this->add_component( $type, $keyword, $value );
					break;
			}
		}

		// Filter for RECURRENCE-IDs
		$recurrences = array();
		if ( array_key_exists( 'VEVENT', $this->cal ) ) {
			foreach ( $this->cal['VEVENT'] as $event ) {
				if ( isset( $event['RECURRENCE-ID'] ) ) {
					$recurrences[] = $event;
				}
			}
			foreach ( $recurrences as $recurrence ) {
				for ( $i = 0; $i < count( $this->cal['VEVENT'] ); $i++ ) {
					if ( $this->cal['VEVENT'][ $i ]['UID'] == $recurrence['UID'] && ! isset( $this->cal['VEVENT'][ $i ]['RECURRENCE-ID'] ) ) {
						$this->cal['VEVENT'][ $i ]['EXDATE'][] = $recurrence['RECURRENCE-ID'];
						break;
					}
				}
			}
		}

		return $this->cal;
	}

	/**
	 * Parse key:value from a string
	 *
	 * @param string $text (default: '')
	 * @return array
	 */
	public function key_value_from_string( $text = '' ) {
		preg_match( '/([^:]+)(;[^:]+)?[:]([\w\W]*)/', $text, $matches );

		if ( 0 == count( $matches ) )
			return false;

		return array( $matches[1], $matches[3] );
	}

	/**
	 * Convert a timezone name into a timezone object.
	 *
	 * @param string $text Timezone name. Example: America/Chicago
	 * @return object|null A DateTimeZone object if the conversion was successful.
	 */
	private function timezone_from_string( $text ) {
		try {
			$timezone = new DateTimeZone( $text );
		} catch ( Exception $e ) {
			$blog_timezone = get_option( 'timezone_string' );
			if ( ! $blog_timezone ) {
				$blog_timezone = 'Etc/UTC';
			}

			$timezone = new DateTimeZone( $blog_timezone );
		}

		return $timezone;
	}

	/**
	 * Add a component to the calendar array
	 *
	 * @param string $component (default: '')
	 * @param string $keyword (default: '')
	 * @param string $value (default: '')
	 * @return void
	 */
	public function add_component( $component = '', $keyword = '', $value = '' ) {
		if ( false == $keyword ) {
			$keyword = $this->last_keyword;
			switch ( $component ) {
			case 'VEVENT':
				$value = $this->cal[ $component ][ $this->event_count - 1 ][ $keyword ] . $value;
				break;
			case 'VTODO' :
				$value = $this->cal[ $component ][ $this->todo_count - 1 ][ $keyword ] . $value;
				break;
			}
		}

		/*
		 * Some events have a specific timezone set in their start/end date,
		 * and it may or may not be different than the calendar timzeone.
		 * Valid formats include:
		 * DTSTART;TZID=Pacific Standard Time:20141219T180000
		 * DTEND;TZID=Pacific Standard Time:20141219T200000
		 * EXDATE:19960402T010000Z,19960403T010000Z,19960404T010000Z
		 * EXDATE;VALUE=DATE:2015050
		 * EXDATE;TZID=America/New_York:20150424T170000
		 * EXDATE;TZID=Pacific Standard Time:20120615T140000,20120629T140000,20120706T140000
		 */

		// Always store EXDATE as an array
		if ( stristr( $keyword, 'EXDATE' ) ) {
			$value = explode( ',', $value );
		}

		// Adjust DTSTART, DTEND, and EXDATE according to their TZID if set
		if ( strpos( $keyword, ';' ) && ( stristr( $keyword, 'DTSTART' ) || stristr( $keyword, 'DTEND' ) || stristr( $keyword, 'EXDATE' ) || stristr( $keyword, 'RECURRENCE-ID' ) ) ) {
			$keyword = explode( ';', $keyword );

			$tzid = false;
			if ( 2 == count( $keyword ) ) {
				$tparam = $keyword[1];

				if ( strpos( $tparam, "TZID" ) !== false ) {
					$tzid = $this->timezone_from_string( str_replace( 'TZID=', '', $tparam ) );
				}
			}

			// Normalize all times to default UTC
			if ( $tzid ) {
				$adjusted_times = array();
				foreach ( (array) $value as $v ) {
					try {
						$adjusted_time = new DateTime( $v, $tzid );
						$adjusted_time->setTimeZone( new DateTimeZone( 'UTC' ) );
						$adjusted_times[] = $adjusted_time->format('Ymd\THis');
					} catch ( Exception $e ) {
						// Invalid argument to DateTime
						return;
					}
				}
				$value = $adjusted_times;
			}

			// Format for adding to event
			$keyword = $keyword[0];
			if ( 'EXDATE' != $keyword ) {
				$value = implode( (array) $value );
			}
		}

		foreach ( (array) $value as $v ) {
			switch ($component) {
				case 'VTODO':
					if ( 'EXDATE' == $keyword ) {
						$this->cal[ $component ][ $this->todo_count - 1 ][ $keyword ][] = $v;
					} else {
						$this->cal[ $component ][ $this->todo_count - 1 ][ $keyword ] = $v;
					}
					break;
				case 'VEVENT':
					if ( 'EXDATE' == $keyword ) {
						$this->cal[ $component ][ $this->event_count - 1 ][ $keyword ][] = $v;
					} else {
						$this->cal[ $component ][ $this->event_count - 1 ][ $keyword ] = $v;
					}
					break;
				default:
					$this->cal[ $component ][ $keyword ] = $v;
					break;
			}
		}
		$this->last_keyword = $keyword;
	}

	/**
	 * Escape strings with wp_kses, allow links
	 *
	 * @param string $string (default: '')
	 * @return string
	 */
	public function escape( $string = '' ) {
		// Unfold content lines per RFC 5545
		$string = str_replace( "\n\t", '', $string );
		$string = str_replace( "\n ", '', $string );

		$allowed_html = array(
			'a' => array(
				'href'  => array(),
				'title' => array()
			)
		);

		$allowed_tags = '';
		foreach ( array_keys( $allowed_html ) as $tag ) {
			$allowed_tags .= "<{$tag}>";
		}

		// Running strip_tags() first with allowed tags to get rid of remaining gallery markup, etc
		// because wp_kses() would only htmlentity'fy that. Then still running wp_kses(), for extra
		// safety and good measure.
		return wp_kses( strip_tags( $string, $allowed_tags ), $allowed_html );
	}

	/**
	 * Render the events
	 *
	 * @param string $url (default: '')
	 * @param string $context (default: 'widget') or 'shortcode'
	 * @return mixed bool|string false on failure, rendered HTML string on success.
	 */
	public function render( $url = '', $args = array() ) {

		$args = wp_parse_args( $args, array(
			'context' => 'widget',
			'number' => 5
		) );

		$events = $this->get_events( $url, $args['number'] );
		$events = $this->apply_timezone_offset( $events );

		if ( empty( $events ) )
			return false;

		ob_start();

		if ( 'widget' == $args['context'] ) : ?>
		<ul class="upcoming-events">
			<?php foreach ( $events as $event ) : ?>
			<li>
				<strong class="event-summary"><?php echo $this->escape( stripslashes( $event['SUMMARY'] ) ); ?></strong>
				<span class="event-when"><?php echo $this->formatted_date( $event ); ?></span>
				<?php if ( ! empty( $event['LOCATION'] ) ) : ?>
					<span class="event-location"><?php echo $this->escape( stripslashes( $event['LOCATION'] ) ); ?></span>
				<?php endif; ?>
				<?php if ( ! empty( $event['DESCRIPTION'] ) ) : ?>
					<span class="event-description"><?php echo wp_trim_words( $this->escape( stripcslashes( $event['DESCRIPTION'] ) ) ); ?></span>
				<?php endif; ?>
			</li>
			<?php endforeach; ?>
		</ul>
		<?php endif;

		if ( 'shortcode' == $args['context'] ) : ?>
		<table class="upcoming-events">
			<thead>
				<tr>
					<th><?php esc_html_e( 'Location', 'jetpack' ); ?></th>
					<th><?php esc_html_e( 'When', 'jetpack' ); ?></th>
					<th><?php esc_html_e( 'Summary', 'jetpack' ); ?></th>
					<th><?php esc_html_e( 'Description', 'jetpack' ); ?></th>
				</tr>
			</thead>
			<tbody>
			<?php foreach ( $events as $event ) : ?>
				<tr>
					<td><?php echo empty( $event['LOCATION'] ) ? '&nbsp;' : $this->escape( stripslashes( $event['LOCATION'] ) ); ?></td>
					<td><?php echo $this->formatted_date( $event ); ?></td>
					<td><?php echo empty( $event['SUMMARY'] ) ? '&nbsp;' : $this->escape( stripslashes( $event['SUMMARY'] ) ); ?></td>
					<td><?php echo empty( $event['DESCRIPTION'] ) ? '&nbsp;' : wp_trim_words( $this->escape( stripcslashes( $event['DESCRIPTION'] ) ) ); ?></td>
				</tr>
			<?php endforeach; ?>
			</tbody>
		</table>
		<?php endif;

		$rendered = ob_get_clean();

		if ( empty( $rendered ) )
			return false;

		return $rendered;
	}

	public function formatted_date( $event ) {

		$date_format = get_option( 'date_format' );
		$time_format = get_option( 'time_format' );
		$start = strtotime( $event['DTSTART'] );
		$end = isset( $event['DTEND'] ) ? strtotime( $event['DTEND'] ) : false;

		$all_day = ( 8 == strlen( $event['DTSTART'] ) );

		if ( !$all_day && $this->timezone ) {
			try {
				$start_time = new DateTime( $event['DTSTART'] );
				$timezone_offset = $this->timezone->getOffset( $start_time );
				$start += $timezone_offset;

				if ( $end ) {
					$end += $timezone_offset;
				}
			} catch ( Exception $e ) {
				// Invalid argument to DateTime
			}
		}
		$single_day = $end ? ( $end - $start ) <= DAY_IN_SECONDS : true;

		/* Translators: Date and time */
		$date_with_time = __( '%1$s at %2$s' , 'jetpack' );
		/* Translators: Two dates with a separator */
		$two_dates = __( '%1$s &ndash; %2$s' , 'jetpack' );

		// we'll always have the start date. Maybe with time
		if ( $all_day )
			$date = date_i18n( $date_format, $start );
		else
			$date = sprintf( $date_with_time, date_i18n( $date_format, $start ), date_i18n( $time_format, $start ) );

		// single day, timed
		if ( $single_day && ! $all_day && false !== $end )
			$date = sprintf( $two_dates, $date, date_i18n( $time_format, $end ) );

		// multi-day
		if ( ! $single_day ) {

			if ( $all_day ) {
				// DTEND for multi-day events represents "until", not "including", so subtract one minute
				$end_date = date_i18n( $date_format, $end - 60 );
			} else {
				$end_date = sprintf( $date_with_time, date_i18n( $date_format, $end ), date_i18n( $time_format, $end ) );
			}

			$date = sprintf( $two_dates, $date, $end_date );

		}

		return $date;
	}

	protected function sort_by_recent( $list ) {
		$dates = $sorted_list = array();

		foreach ( $list as $key => $row ) {
			$date = $row['DTSTART'];
			// pad some time onto an all day date
			if ( 8 === strlen( $date ) )
				$date .= 'T000000Z';
			$dates[$key] = $date;
		}
		asort( $dates );
		foreach( $dates as $key => $value ) {
			$sorted_list[$key] = $list[$key];
		}
		unset($list);
		return $sorted_list;
	}

}


/**
 * Wrapper function for iCalendarReader->get_events()
 *
 * @param string $url (default: '')
 * @return array
 */
function icalendar_get_events( $url = '', $count = 5 ) {
	// Find your calendar's address http://support.google.com/calendar/bin/answer.py?hl=en&answer=37103
	$ical = new iCalendarReader();
	return $ical->get_events( $url, $count );
}

/**
 * Wrapper function for iCalendarReader->render()
 *
 * @param string $url (default: '')
 * @param string $context (default: 'widget') or 'shortcode'
 * @return mixed bool|string false on failure, rendered HTML string on success.
 */
function icalendar_render_events( $url = '', $args = array() ) {
	$ical = new iCalendarReader();
	return $ical->render( $url, $args );
}
