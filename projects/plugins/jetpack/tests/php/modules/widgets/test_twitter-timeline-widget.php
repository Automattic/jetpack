<?php // phpcs:ignore Wordpress.Files.FileName.NotHyphenatedLowercase
/**
 * Test Jetpack_Twitter_Timeline_Widget.
 *
 * @package automattic/jetpack
 */

require __DIR__ . '/../../../../modules/widgets/twitter-timeline.php';

/**
 * Test Jetpack_Twitter_Timeline_Widget.
 */
class WP_Test_Twitter_Timeline_Widget extends WP_UnitTestCase {

	/**
	 * The tested instance.
	 *
	 * @var Jetpack_Twitter_Timeline_Widget
	 */
	public $instance;

	/**
	 * Sets up each test.
	 *
	 * @inheritDoc
	 */
	public function set_up() {
		parent::set_up();
		$this->instance = new Jetpack_Twitter_Timeline_Widget();
	}

	/**
	 * Gets the test data for test_widget().
	 *
	 * @return array The test data.
	 */
	public function get_widget_data() {
		return array(
			'no_id'                    => array(
				array(),
				false,
				'<div><a class="twitter-timeline" data-lang="EN" data-partner="jetpack" data-widget-id="" href="https://twitter.com/">My Tweets</a></div>',
			),
			'type_is_widget_id'        => array(
				array( 'type' => 'widget-id' ),
				false,
				'<div><h1>Twitter Timeline</h1><p>The Twitter Timeline widget can&#039;t display tweets based on searches or hashtags. To display a simple list of tweets instead, change the Widget ID to a Twitter username. Otherwise, delete this widget.</p><p>(Only administrators will see this message.)</p></div>',
			),
			'only_widget_id_present'   => array(
				array( 'widget-id' => 'wordpress' ),
				false,
				'<div><a class="twitter-timeline" data-lang="EN" data-partner="jetpack" data-widget-id="wordpress" href="https://twitter.com/wordpress">My Tweets</a></div>',
			),
			'type_is_profile'          => array(
				array(
					'widget-id' => 'wordpress',
					'type'      => 'profile',
				),
				false,
				'<div><a class="twitter-timeline" data-lang="EN" data-partner="jetpack" href="https://twitter.com/wordpress" href="https://twitter.com/wordpress">My Tweets</a></div>',
			),
			'with_data_attributes'     => array(
				array(
					'width'        => '200',
					'height'       => '400',
					'theme'        => 'dark',
					'border-color' => '#ffffff',
					'tweet-limit'  => '9',
					'lang'         => 'es',
				),
				false,
				'<div><a class="twitter-timeline" data-width="200" data-height="400" data-theme="dark" data-border-color="#ffffff" data-tweet-limit="9" data-lang="EN" data-partner="jetpack" data-widget-id="" href="https://twitter.com/">My Tweets</a></div>',
			),
			'data_chrome'              => array(
				array(
					'widget-id' => 'wordpress',
					'chrome'    => array( 'noborders', 'nofooter' ),
				),
				false,
				'<div><a class="twitter-timeline" data-lang="EN" data-partner="jetpack" data-chrome="noborders nofooter" data-widget-id="wordpress" href="https://twitter.com/wordpress">My Tweets</a></div>',
			),
			'amp_no_widget_id_present' => array(
				array(),
				true,
				'<div><amp-twitter data-lang="EN" data-partner="jetpack" layout="responsive" data-timeline-source-type="profile" data-timeline-screen-name="" width="600" height="480">My Tweets</amp-twitter></div>',
			),
			'amp_widget_id_present'    => array(
				array( 'widget-id' => 'wordpress' ),
				true,
				'<div><amp-twitter data-lang="EN" data-partner="jetpack" layout="responsive" data-timeline-source-type="profile" data-timeline-screen-name="wordpress" width="600" height="480">My Tweets</amp-twitter></div>',
			),
			'amp_with_data_attributes' => array(
				array(
					'width'        => '200',
					'height'       => '800',
					'theme'        => 'light',
					'border-color' => '#ff0000',
					'tweet-limit'  => '4',
					'lang'         => 'cnr',
				),
				true,
				'<div><amp-twitter data-width="200" data-height="800" data-theme="light" data-border-color="#ff0000" data-tweet-limit="4" data-lang="EN" data-partner="jetpack" layout="responsive" data-timeline-source-type="profile" data-timeline-screen-name="" width="200" height="800">My Tweets</amp-twitter></div>',
			),
		);
	}

	/**
	 * Test the widget method that outputs the markup.
	 *
	 * @dataProvider get_widget_data
	 * @covers Jetpack_Twitter_Timeline_Widget::widget()
	 *
	 * @param array  $instance The widget instance.
	 * @param bool   $is_amp Whether this is on an AMP endpoint.
	 * @param string $expected The expected output of the tested method.
	 */
	public function test_widget( $instance, $is_amp, $expected ) {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		if ( $is_amp ) {
			add_filter( 'jetpack_is_amp_request', '__return_true' );
		}

		$args = array(
			'before_widget' => '<div>',
			'after_widget'  => '</div>',
			'before_title'  => '<h1>',
			'after_title'   => '</h1>',
		);

		ob_start();
		$this->instance->widget( $args, $instance );

		$this->assertEquals( $expected, ob_get_clean() );
	}
}
