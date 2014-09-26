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

	protected function filter_past_and_recurring_events( $events ) {
		$upcoming = array();
		$set_recurring_events = array();
		$current = time();

		foreach ( $events as $event ) {

			$date_from_ics = strtotime( $event['DTSTART'] );

			if ( isset( $event['RRULE'] ) && $this->timezone->getName() && 8 != strlen( $event['DTSTART'] ) ) {
				$adjusted_time = new DateTime( $event['DTSTART'], new DateTimeZone('UTC') );
				$adjusted_time->setTimeZone( new DateTimeZone( $this->timezone->getName() ) );
				$event['DTSTART'] = $adjusted_time->format('Ymd\THis');

				$adjusted_time = new DateTime( $event['DTEND'], new DateTimeZone('UTC') );
				$adjusted_time->setTimeZone( new DateTimeZone( $this->timezone->getName() ) );
				$event['DTEND'] = $adjusted_time->format('Ymd\THis');
			}

			if ( ! isset( $event['DTSTART'] ) )
				continue;

			// use end time if it's there
			$time = ( isset( $event['DTEND'] ) ) ? $event['DTEND'] : $event['DTSTART'];
			$end = strtotime( $time );

			// process events with RRULE before other events

			$rrule = isset( $event['RRULE'] ) ? $event['RRULE'] : false ;
			$uid = $event['UID'];

			if ( $rrule && ! in_array( $uid, $set_recurring_events ) ) {

				// break down the RRULE into digestible chunks
				$rrule_array = array();

				foreach ( explode( ";", $event['RRULE'] ) as $rline ) {
					list( $rkey, $rvalue ) = explode( "=", $rline, 2 );
					$rrule_array[$rkey] = $rvalue;
				}

				switch ( $rrule_array['FREQ'] ) {

					case 'DAILY':
						$frequency = 'day';
						if ( $date_from_ics >= $current ) {
							$echo_limit = 10;
							if ( 8 == strlen( $event['DTSTART'] ) ) {
								$recurring_event_date_start = date( "Ymd", strtotime( $event['DTSTART'] ) );
								$recurring_event_date_end = date( "Ymd", strtotime( $event['DTEND'] ) );
							} else {
								$recurring_event_date_start = date( "Ymd\THis", strtotime( $event['DTSTART'] ) );
								$recurring_event_date_end = date( "Ymd\THis", strtotime( $event['DTEND'] ) );
							}
						} else {
							$echo_limit = 10;
							$current_date = date( 'Ymd' );
							if ( 8 == strlen( $event['DTSTART'] ) ) {
								$recurring_event_date_start = $current_date;
								$recurring_event_date_end = $current_date;
							} else {
								$recurring_event_date_start = $current_date . date( "\THis", strtotime( $event['DTSTART'] ) );
								$recurring_event_date_end = $current_date . date( "\THis", strtotime( $event['DTEND'] ) );
							}
						}
						break;

					case 'WEEKLY':
						$frequency = 'week';
						if ( $date_from_ics >= $current ) {
							$echo_limit = 2;
							if ( 8 == strlen( $event['DTSTART'] ) ) {
								$recurring_event_date_start = date( "Ymd", strtotime( $event['DTSTART'] ) );
								$recurring_event_date_end = date( "Ymd", strtotime( $event['DTEND'] ) );
							} else {
								$recurring_event_date_start = date( "Ymd\THis", strtotime( $event['DTSTART'] ) );
								$recurring_event_date_end = date( "Ymd\THis", strtotime( $event['DTEND'] ) );
							}
						} else {
							$echo_limit = 3;
							$current_date = date( 'Ym' );
							if ( 8 == strlen( $event['DTSTART'] ) ) {
								$recurring_event_date_start = date( "d", strtotime( $event['DTSTART'] ) );
								$recurring_event_date_end = date( "d", strtotime( $event['DTEND'] ) );
							} else {
								$recurring_event_date_start = $current_date . date( "d\THis", strtotime( $event['DTSTART'] ) );
								$recurring_event_date_end = $current_date . date( "d\THis", strtotime( $event['DTEND'] ) );
							}
						}

						// Build list of days of week to add events
						$weekdays = array( 'SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA' );
						$bydays = ( isset( $rrule_array['BYDAY'] ) && $rrule_array['BYDAY'] != '' ) ? explode( ',', $rrule_array['BYDAY'] ) : $weekdays;
						break;

					case 'MONTHLY':
						$frequency = 'month';
						if ( $date_from_ics >= $current ) {
							$echo_limit = 1;
							if ( 8 == strlen( $event['DTSTART'] ) ) {
								$recurring_event_date_start = date( "Ymd", strtotime( $event['DTSTART'] ) );
								$recurring_event_date_end = date( "Ymd", strtotime( $event['DTEND'] ) );
							} else {
								$recurring_event_date_start = date( "Ymd\THis", strtotime( $event['DTSTART'] ) );
								$recurring_event_date_end = date( "Ymd\THis", strtotime( $event['DTEND'] ) );
							}
						} else {
							$echo_limit = 2;
							$current_date = date( 'Ym' );
							if ( 8 == strlen( $event['DTSTART'] ) ) {
								$recurring_event_date_start = date( "d", strtotime( $event['DTSTART'] ) );
								$recurring_event_date_end = date( "d", strtotime( $event['DTEND'] ) );
							} else {
								$recurring_event_date_start = $current_date . date( "d\THis", strtotime( $event['DTSTART'] ) );
								$recurring_event_date_end = $current_date . date( "d\THis", strtotime( $event['DTEND'] ) );
							}
						}
						break;

					case 'YEARLY':
						$frequency = 'year';
						if ( $date_from_ics >= $current ) {
							$echo_limit = 1;
							if ( 8 == strlen( $event['DTSTART'] ) ) {
								$recurring_event_date_start = date( "Ymd", strtotime( $event['DTSTART'] ) );
								$recurring_event_date_end = date( "Ymd", strtotime( $event['DTEND'] ) );
							} else {
								$recurring_event_date_start = date( "Ymd\THis", strtotime( $event['DTSTART'] ) );
								$recurring_event_date_end = date( "Ymd\THis", strtotime( $event['DTEND'] ) );
							}
						} else {
							$echo_limit = 1;
							$current_date = date( 'Y' );
							if ( 8 == strlen( $event['DTSTART'] ) ) {
								$recurring_event_date_start = date( "md", strtotime( $event['DTSTART'] ) );
								$recurring_event_date_end = date( "md", strtotime( $event['DTEND'] ) );
							} else {
								$recurring_event_date_start = $current_date . date( "md\THis", strtotime( $event['DTSTART'] ) );
								$recurring_event_date_end = $current_date . date( "md\THis", strtotime( $event['DTEND'] ) );
							}
						}
						break;

					default:
						$frequency = false;
				}

				if ( isset( $rrule_array['COUNT'] ) ) {
					$rrule_count = $rrule_array['COUNT'];
					$echo_limit = 50;
				}

				if ( $frequency !== false ) {

					$interval = ( isset( $rrule_array['INTERVAL'] ) ) ? $rrule_array['INTERVAL'] : 1;
					$count_counter = 1;

					for ( $i = 1; $i <= $echo_limit; $i++ ) {
						if ( isset( $rrule_array['COUNT'] ) && $i === 1 ) {
							$recurring_event_date_start = date( "Ymd\THis", strtotime( $event['DTSTART'] ) );
							$recurring_event_date_end = date( "Ymd\THis", strtotime( $event['DTEND'] ) );
						} elseif ( $i === 1 ) {
							// variables set in switch above
							$rrule_count = 10;
						} else {
							$recurring_event_date_start = date( "Ymd\THis", strtotime( $event['DTSTART'] . '+' . $interval . ' ' . $frequency . 's' ) );
							$recurring_event_date_end = date( "Ymd\THis", strtotime( $event['DTEND'] . '+' . $interval . ' ' . $frequency . 's' ) );
						}
						$event_start = strtotime( $recurring_event_date_start );
						$event_end = strtotime( $recurring_event_date_end );
						$until = ( isset( $rrule_array['UNTIL'] ) ) ? strtotime( $rrule_array['UNTIL'] ) : strtotime( '+1 year' );
						$exdate = ( isset( $event['EXDATE;VALUE=DATE'] ) ) ? $event['EXDATE;VALUE=DATE'] : null;

						if ( isset( $rrule_array['BYDAY'] ) && $frequency === 'week' ) {
							if ( $rrule_array['BYDAY'] === "SU" ) {
								if ( 8 == strlen( $event['DTSTART'] ) ) {
									$byday_event_date_start = date( "Ymd", strtotime( "last Sunday", strtotime( $recurring_event_date_start ) ) );
									$byday_event_date_end = date( "Ymd", strtotime( "last Sunday", strtotime( $recurring_event_date_start ) ) );
								} else {
									$byday_event_date_start = date( "Ymd\T", strtotime( "last Sunday", strtotime( $recurring_event_date_start ) ) ) . date( "His", strtotime( $recurring_event_date_start) );
									$byday_event_date_end = date( "Ymd\T", strtotime( "last Sunday", strtotime( $recurring_event_date_end ) ) ) . date( "His", strtotime( $recurring_event_date_end) );
								}
							} else {
								if ( 8 == strlen( $event['DTSTART'] ) ) {
									$byday_event_date_start = date( "Ymd", strtotime( "last Sunday", strtotime( $recurring_event_date_start ) ) );
									$byday_event_date_end = date( "Ymd", strtotime( "last Sunday", strtotime( $recurring_event_date_end ) ) );
								} else {
									$byday_event_date_start = date( "Ymd\T", strtotime( "last Sunday", strtotime( $recurring_event_date_start ) ) ) . date( "His", strtotime( $recurring_event_date_start) );
									$byday_event_date_end = date( "Ymd\T", strtotime( "last Sunday", strtotime( $recurring_event_date_end ) ) ) . date( "His", strtotime( $recurring_event_date_end) );
								}
							}
							$byday_event_start = strtotime( $byday_event_date_start );
							$byday_event_end = strtotime( $byday_event_date_end );

							foreach ( $weekdays as $day ) {
								// Check if day should be added
								if ( in_array( $day, $bydays ) && $byday_event_end >= $current && $byday_event_end <= $until && $count_counter <= $rrule_count && $byday_event_start >= $date_from_ics && $byday_event_date_start != $exdate ) {

									// Add event to day
									$event['DTSTART'] = $byday_event_date_start;
									$event['DTEND'] = $byday_event_date_end;

									if ( $this->timezone->getName() && 8 != strlen( $event['DTSTART'] ) ) {
										$adjusted_time = new DateTime( $event['DTSTART'], new DateTimeZone( $this->timezone->getName() ) );
										$adjusted_time->setTimeZone( new DateTimeZone( 'UTC' ) );
										$event['DTSTART'] = $adjusted_time->format('Ymd\THis');

										$adjusted_time = new DateTime( $event['DTEND'], new DateTimeZone( $this->timezone->getName() ) );
										$adjusted_time->setTimeZone( new DateTimeZone( 'UTC' ) );
										$event['DTEND'] = $adjusted_time->format('Ymd\THis');
									}

									$upcoming[] = $event;
									$count_counter++;
								} elseif ( in_array( $day, $bydays ) && $count_counter <= $rrule_count ) {
									$count_counter++;
								} else {
									$event['DTSTART'] = $byday_event_date_start;
									$event['DTEND'] = $byday_event_date_end;
								}
								// Move forward a day
								if ( 8 == strlen( $event['DTSTART'] ) ) {
									$byday_event_date_start = date( "Ymd", strtotime( $byday_event_date_start . '+1 day' ) );
									$byday_event_date_end = date( "Ymd", strtotime( $byday_event_date_end . '+1 day' ) );
								} else {
									$byday_event_date_start = date( "Ymd\THis", strtotime( $byday_event_date_start . '+1 day' ) );
									$byday_event_date_end = date( "Ymd\THis", strtotime( $byday_event_date_end . '+1 day' ) );
								}
								$byday_event_start = strtotime( $byday_event_date_start );
								$byday_event_end = strtotime( $byday_event_date_end );

							}

						} elseif ( isset( $rrule_array['BYDAY'] ) && $frequency === 'month' ) {
							$byday_monthly_date_start = strtotime( $recurring_event_date_start );
							$start_time = date( 'His', $byday_monthly_date_start );
							$day_number = substr( $rrule_array['BYDAY'], 0, 1 );
							$week_day = substr( $rrule_array['BYDAY'], 1 );
							$day_cardinals = array( 1 => 'first', 2 => 'second', 3 => 'third', 4 => 'fourth', 5 => 'fifth' );
							$weekdays = array( 'SU' => 'sunday', 'MO' => 'monday', 'TU' => 'tuesday', 'WE' => 'wednesday', 'TH' => 'thursday', 'FR' => 'friday', 'SA' => 'saturday' );
							$event_start_desc = "{$day_cardinals[$day_number]} {$weekdays[$week_day]} of " . date( 'F', $byday_monthly_date_start ) . " " . date( 'Y', $byday_monthly_date_start ) . " " . date( 'H:i:s', $byday_monthly_date_start );
							$event_start_timestamp = strtotime( $event_start_desc );
							$exdate_compare = date( "Ymd", strtotime( $event_start_desc ) );

							if ( $event_start_timestamp > $current && $event_start_timestamp < $until  && $count_counter <= $rrule_count && $event_start_timestamp >= $date_from_ics && $exdate_compare != $exdate ) {
								if ( 8 == strlen( $event['DTSTART'] ) ) {
									$event['DTSTART'] = date( 'Ymd', $event_start_timestamp );
									$event['DTEND'] = date( 'Ymd', strtotime( $event['DTEND'] ) . "+" . $interval . " " . $frequency . "s" );
								} else {
									$event['DTSTART'] = date( 'Ymd\T', $event_start_timestamp ) . $start_time;
									$event['DTEND'] = date( 'Ymd\THis', strtotime( $event['DTEND'] ) . "+" . $interval . " " . $frequency . "s" );
								}
								if ( $this->timezone->getName() && 8 != strlen( $event['DTSTART'] ) ) {
									$adjusted_time = new DateTime( $event['DTSTART'], new DateTimeZone( $this->timezone->getName() ) );
									$adjusted_time->setTimeZone( new DateTimeZone( 'UTC' ) );
									$event['DTSTART'] = $adjusted_time->format('Ymd\THis');

									$adjusted_time = new DateTime( $event['DTEND'], new DateTimeZone( $this->timezone->getName() ) );
									$adjusted_time->setTimeZone( new DateTimeZone( 'UTC' ) );
									$event['DTEND'] = $adjusted_time->format('Ymd\THis');
								}
								$upcoming[] = $event;
								$count_counter++;
							} else {
								if ( 8 == strlen( $event['DTSTART'] ) ) {
									$event['DTSTART'] = date( 'Ymd', $event_start_timestamp );
									$event['DTEND'] = date( 'Ymd', strtotime( $event['DTEND'] ) . "+" . $interval . " " . $frequency . "s" );
								} else {
									$event['DTSTART'] = date( 'Ymd\T', $event_start_timestamp ) . $start_time;
									$event['DTEND'] = date( 'Ymd\THis', strtotime( $event['DTEND'] ) . "+" . $interval . " " . $frequency . "s" );
								}
							}

						} elseif ( $event_start >= $date_from_ics && $event_end >= $current && $event_end <= $until && $count_counter <= $rrule_count ) {
							$event['DTSTART'] = $recurring_event_date_start;
							$event['DTEND'] = $recurring_event_date_end;

							$exdate_compare = date( "Ymd", strtotime( $recurring_event_date_start ) );

							if ( $this->timezone->getName() ) {
								$adjusted_time = new DateTime( $event['DTSTART'], new DateTimeZone( $this->timezone->getName() ) );
								$adjusted_time->setTimeZone( new DateTimeZone( 'UTC' ) );
								$event['DTSTART'] = $adjusted_time->format('Ymd\THis');

								$adjusted_time = new DateTime( $event['DTEND'], new DateTimeZone( $this->timezone->getName() ) );
								$adjusted_time->setTimeZone( new DateTimeZone( 'UTC' ) );
								$event['DTEND'] = $adjusted_time->format('Ymd\THis');
							}
							if ( $exdate_compare != $exdate ) {
								$upcoming[] = $event;
								$count_counter++;
							}
						} else {
							$event['DTSTART'] = $recurring_event_date_start;
							$event['DTEND'] = $recurring_event_date_end;
							$count_counter++;
						}
					}
					$set_recurring_events[] = $uid;

				}

			} else {
				// now process normal events
				if ( $end >= $current )
					$upcoming[] = $event;
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

		if ( strpos( $keyword, ';' ) && ( stristr( $keyword, 'DTSTART' ) || stristr( $keyword, 'DTEND' ) ) ) {
			$keyword = explode( ';', $keyword );

			/*
			 * Some events have a specific timzeone set in their start/end date,
			 * and it may or may not be different than the calendar timzeone.
			 * I.e: "DTSTART;TZID=America/Los_Angeles:20130124T173000"
			 * Since we're already adjusting the timezone on presentation, let's normalize all times to default UTC now
			 */
			if ( strpos( $keyword[1], "TZID") !== false ) {
				$tzid = explode( '=', $keyword[1] );
				$tzid = $this->timezone_from_string( $tzid[1] );
				if ( $tzid ) {
					$adjusted_time = new DateTime( $value, $tzid );
					$adjusted_time->setTimeZone( new DateTimeZone( 'UTC' ) );
					$value = $adjusted_time->format('Ymd\THis');
				}
			}

			$keyword = $keyword[0];
		}

		switch ($component) {
		case 'VTODO':
			$this->cal[ $component ][ $this->todo_count - 1 ][ $keyword ] = $value;
			break;
		case 'VEVENT':
			$this->cal[ $component ][ $this->event_count - 1 ][ $keyword ] = $value;
			break;
		default:
			$this->cal[ $component ][ $keyword ] = $value ;
			break;
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
					<th>Location</th>
					<th>When</th>
					<th>Summary</th>
					<th>Description</th>
				</tr>
			</thead>
			<tbody>
			<?php foreach ( $events as $event ) : ?>
				<tr>
					<td><?php echo $this->escape( stripslashes( $event['LOCATION'] ) ); ?></td>
					<td><?php echo $this->formatted_date( $event ); ?></td>
					<td><?php echo $this->escape( stripslashes( $event['SUMMARY'] ) ); ?></td>
					<td><?php echo wp_trim_words( $this->escape( stripcslashes( $event['DESCRIPTION'] ) ) ); ?></td>
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

			if ( $all_day )
				$end_date = date_i18n( $date_format, $end );
			else
				$end_date = sprintf( $date_with_time, date_i18n( $date_format, $end ), date_i18n( $time_format, $end ) );

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
