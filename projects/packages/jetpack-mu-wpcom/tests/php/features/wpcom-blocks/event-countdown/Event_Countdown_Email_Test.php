<?php
/**
 * Event Countdown email rendering tests.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\DataProvider;
use function Automattic\Jetpack\Jetpack_Mu_Wpcom\EventCountdown\render_email;

require_once __DIR__ . '/fixtures/class-mock-table-wrapper-helper.php';
require_once Jetpack_Mu_Wpcom::BASE_DIR . 'features/wpcom-blocks/event-countdown/event-countdown.php';

/**
 * Class Event_Countdown_Email_Test
 */
class Event_Countdown_Email_Test extends \WorDBless\BaseTestCase {

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		update_option( 'timezone_string', 'UTC' );
		update_option( 'date_format', 'F j, Y' );
		update_option( 'time_format', 'g:i a' );
	}

	/**
	 * Build the saved block markup the way save.jsx writes it.
	 *
	 * @param string|int $date  Contents of the hidden date element.
	 * @param string     $title Event title.
	 * @return string
	 */
	private function block_markup( $date, $title = 'My Event' ) {
		return '<div class="wp-block-jetpack-event-countdown"><div><div class="event-countdown__date">' . $date . '</div>'
			. '<div class="event-countdown__counter"><p><strong class="event-countdown__day">&nbsp;</strong> days</p></div>'
			. '<div class="event-countdown__event-title"><p>' . $title . '</p></div></div></div>';
	}

	public function test_renders_days_title_and_date_for_future_event() {
		$timestamp = time() + 12 * DAY_IN_SECONDS + HOUR_IN_SECONDS;
		$html      = render_email( $this->block_markup( $timestamp ), array( 'attrs' => array( 'eventTimestamp' => $timestamp ) ), new stdClass() );

		$this->assertStringContainsString( '>12</p>', $html );
		$this->assertStringContainsString( 'days until', $html );
		$this->assertStringContainsString( '>My Event</p>', $html );
		$this->assertStringContainsString( wp_date( 'F j, Y', $timestamp ) . ' at ' . wp_date( 'g:i a', $timestamp ), $html );
		$this->assertStringNotContainsString( (string) $timestamp, $html );
	}

	public function test_counts_hours_inside_the_last_day() {
		$timestamp = time() + 5 * HOUR_IN_SECONDS + MINUTE_IN_SECONDS;
		$html      = render_email( $this->block_markup( $timestamp ), array( 'attrs' => array( 'eventTimestamp' => $timestamp ) ), new stdClass() );

		$this->assertStringContainsString( '>5</p>', $html );
		$this->assertStringContainsString( 'hours until', $html );
	}

	public function test_shows_at_least_one_minute_until_the_event_starts() {
		$timestamp = time() + 30;
		$html      = render_email( $this->block_markup( $timestamp ), array( 'attrs' => array( 'eventTimestamp' => $timestamp ) ), new stdClass() );

		$this->assertStringContainsString( '>1</p>', $html );
		$this->assertStringContainsString( 'minute until', $html );
	}

	public function test_past_event_shows_title_and_date_without_countdown() {
		$timestamp = time() - DAY_IN_SECONDS;
		$html      = render_email( $this->block_markup( $timestamp ), array( 'attrs' => array( 'eventTimestamp' => $timestamp ) ), new stdClass() );

		$this->assertStringNotContainsString( 'until', $html );
		$this->assertStringContainsString( '>My Event</p>', $html );
		$this->assertStringContainsString( wp_date( 'F j, Y', $timestamp ), $html );
	}

	public function test_legacy_event_date_string_is_read_from_markup_in_site_timezone() {
		update_option( 'timezone_string', 'America/New_York' );
		$html = render_email( $this->block_markup( '2099-07-04T09:30:00' ), array( 'attrs' => array() ), new stdClass() );

		$this->assertStringContainsString( 'July 4, 2099 at 9:30 am', $html );
		$this->assertStringContainsString( 'days until', $html );
	}

	public function test_title_is_escaped_once_and_tags_are_dropped() {
		$timestamp = time() + DAY_IN_SECONDS;
		$html      = render_email( $this->block_markup( $timestamp, 'Tom &amp; Jerry &lt;3 <script>x</script>' ), array( 'attrs' => array( 'eventTimestamp' => $timestamp ) ), new stdClass() );

		$this->assertStringContainsString( '>Tom &amp; Jerry &lt;3</p>', $html );
		$this->assertStringNotContainsString( '<script', $html );
	}

	/**
	 * @param string $date Contents of the hidden date element.
	 * @dataProvider provide_unusable_dates
	 */
	#[DataProvider( 'provide_unusable_dates' )]
	public function test_returns_empty_without_a_usable_date( $date ) {
		$this->assertSame( '', render_email( $this->block_markup( $date ), array( 'attrs' => array() ), new stdClass() ) );
	}

	/**
	 * Dates the renderer must refuse rather than fall back to "now".
	 *
	 * @return array[]
	 */
	public static function provide_unusable_dates() {
		return array(
			'garbage' => array( 'not a date' ),
			'empty'   => array( '' ),
		);
	}

	public function test_block_registers_the_email_renderer() {
		$registry = WP_Block_Type_Registry::get_instance();
		if ( ! $registry->is_registered( 'jetpack/event-countdown' ) ) {
			\Automattic\Jetpack\Jetpack_Mu_Wpcom\EventCountdown\register_block();
		}

		$this->assertTrue( is_callable( $registry->get_registered( 'jetpack/event-countdown' )->render_email_callback ) );
	}
}
