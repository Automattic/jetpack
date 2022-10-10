<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests Options class.
 *
 * @package jetpack-stats
 */

namespace Automattic\Jetpack\Stats;

/**
 * Class to test the Options class.
 *
 * @covers Options
 */
class Test_Options extends StatsBaseTestCase {
	/**
	 * Clean up the testing environment.
	 *
	 * @after
	 */
	public function tear_down() {
		$reflected_class    = new \ReflectionClass( 'Automattic\Jetpack\Stats\Options' );
		$reflected_property = $reflected_class->getProperty( 'options' );
		$reflected_property->setAccessible( true );
		$reflected_property = $reflected_property->setValue( array() );

		parent::tear_down();
	}

	/**
	 * Test for Options::get_options
	 */
	public function test_get_options() {
		$options           = Options::get_options();
		$options_should_be = array(
			'admin_bar'    => true,
			'roles'        => array(
				'administrator',
			),
			'count_roles'  => array(),
			'do_not_track' => true,
			'blog_id'      => 1234,
			'version'      => self::DEFAULT_STATS_VERSION,
		);
		$this->assertSame( $options_should_be, $options );
	}

	/**
	 * Test for Options::get_options with stored stats version < 9.
	 */
	public function test_get_options_with_stats_version_lt_9() {
		update_option(
			'stats_options',
			array(
				'version'   => 8,
				'reg_users' => true,
			)
		);
		$options           = Options::get_options();
		$options_should_be = array(
			'admin_bar'    => true,
			'roles'        => array(
				'administrator',
			),
			'count_roles'  => array_keys( get_editable_roles() ),
			'do_not_track' => true,
			'blog_id'      => 1234,
			'version'      => self::DEFAULT_STATS_VERSION,
		);
		$this->assertSame( $options_should_be, $options );
	}

	/**
	 * Data provider for test_get_option.
	 *
	 * @return array
	 */
	public function statsGetOptionDataProvider() {
		return array(
			'Blog ID'      => array(
				'option_name'  => 'blog_id',
				'option_value' => 1234,
			),
			'Roles'        => array(
				'option_name'  => 'roles',
				'option_value' => array( 'administrator' ),
			),
			'Count Roles'  => array(
				'option_name'  => 'count_roles',
				'option_value' => array(),
			),
			'Version'      => array(
				'option_name'  => 'version',
				'option_value' => self::DEFAULT_STATS_VERSION,
			),
			'Honor DNT'    => array(
				'option_name'  => 'do_not_track',
				'option_value' => true,
			),
			'Non existent' => array(
				'option_name'  => 'dummy',
				'option_value' => null,
			),
		);
	}

	/**
	 * Test for Options::get_option
	 *
	 * @dataProvider statsGetOptionDataProvider
	 *
	 * @param  string $option_name  The Stats option name.
	 * @param  mixed  $option_value The expected Stats option value.
	 */
	public function test_get_option( $option_name, $option_value ) {
		$this->assertSame( $option_value, Options::get_option( $option_name ) );
	}

	/**
	 * Data provider for test_set_options.
	 *
	 * @return array
	 */
	public function statsSetOptionsDataProvider() {
		return array(
			'not array'            => array(
				'set_options'    => null,
				'result'         => false,
				'stored_options' => false,
			),
			'set only count roles' => array(
				'options'        => array(
					'count_roles' => array(),
				),
				'result'         => true,
				'stored_options' => array(
					'admin_bar'    => true,
					'roles'        => array(
						'administrator',
					),
					'count_roles'  => array(),
					'do_not_track' => true,
					'blog_id'      => 1234,
					'version'      => self::DEFAULT_STATS_VERSION,
				),
			),
			'set version'          => array(
				'options'        => array(
					'version' => 'dummy',
				),
				'result'         => true,
				'stored_options' => array(
					'admin_bar'    => true,
					'roles'        => array(
						'administrator',
					),
					'count_roles'  => array(),
					'do_not_track' => true,
					'blog_id'      => 1234,
					'version'      => self::DEFAULT_STATS_VERSION,
				),
			),
			'set blog blog_id'     => array(
				'options'        => array(
					'blog_id' => 999,
				),
				'result'         => true,
				'stored_options' => array(
					'admin_bar'    => true,
					'roles'        => array(
						'administrator',
					),
					'count_roles'  => array(),
					'do_not_track' => true,
					'blog_id'      => 1234,
					'version'      => self::DEFAULT_STATS_VERSION,
				),
			),
			'multiple options'     => array(
				'options'        => array(
					'admin_bar'    => false,
					'roles'        => array(
						'administrator',
						'editor',
					),
					'count_roles'  => array(
						'administrator',
					),
					'do_not_track' => false,
				),
				'result'         => true,
				'stored_options' => array(
					'admin_bar'    => false,
					'roles'        => array(
						'administrator',
						'editor',
					),
					'count_roles'  => array(
						'administrator',
					),
					'do_not_track' => false,
					'blog_id'      => 1234,
					'version'      => self::DEFAULT_STATS_VERSION,
				),
			),
		);
	}

	/**
	 * Test for Options::set_options
	 *
	 * @dataProvider statsSetOptionsDataProvider
	 *
	 * @param mixed $set_options     The Stats options to set.
	 * @param bool  $result          The expected result.
	 * @param mixed $stored_options  The expected Stats stored options.
	 */
	public function test_set_options( $set_options, $result, $stored_options ) {
		$this->assertSame( $result, Options::set_options( $set_options ) );
		$this->assertSame( $stored_options, get_option( 'stats_options' ) );
	}

	/**
	 * Test for Options::set_options with existing options set.
	 */
	public function test_set_options_with_existing_options_set() {
		update_option(
			'stats_options',
			array(
				'admin_bar'    => false,
				'roles'        => array(
					'editor',
				),
				'count_roles'  => array(
					'administrator',
				),
				'do_not_track' => false,
				'version'      => '7',
				'blog_id'      => 'invalid',
				'dummy_option' => 'Dummy',
			)
		);

		$set_options    = array(
			'do_not_track' => true,
		);
		$stored_options = array(
			'admin_bar'    => false,
			'roles'        => array(
				'editor',
			),
			'count_roles'  => array(
				'administrator',
			),
			'do_not_track' => true,
			'blog_id'      => 1234,
			'version'      => self::DEFAULT_STATS_VERSION,
		);
		$this->assertTrue( Options::set_options( $set_options ) );
		$this->assertSame( $stored_options, get_option( 'stats_options' ) );
		$this->assertSame( $stored_options, Options::get_options() );
	}

	/**
	 * Data provider for test_set_option.
	 *
	 * @return array
	 */
	public function statsSetOptionDataProvider() {
		return array(
			'Blog ID'      => array(
				'option_name'    => 'blog_id',
				'option_value'   => 888,
				'stored_options' => array(
					'admin_bar'    => true,
					'roles'        => array(
						'administrator',
					),
					'count_roles'  => array(),
					'do_not_track' => true,
					'blog_id'      => 1234,
					'version'      => self::DEFAULT_STATS_VERSION,
				),
			),
			'Roles'        => array(
				'option_name'    => 'roles',
				'option_value'   => array( 'administrator', 'editor' ),
				'stored_options' => array(
					'admin_bar'    => true,
					'roles'        => array(
						'administrator',
						'editor',
					),
					'count_roles'  => array(),
					'do_not_track' => true,
					'blog_id'      => 1234,
					'version'      => self::DEFAULT_STATS_VERSION,
				),
			),
			'Count Roles'  => array(
				'option_name'    => 'count_roles',
				'option_value'   => array( 'administrator' ),
				'stored_options' => array(
					'admin_bar'    => true,
					'roles'        => array(
						'administrator',
					),
					'count_roles'  => array( 'administrator' ),
					'do_not_track' => true,
					'blog_id'      => 1234,
					'version'      => self::DEFAULT_STATS_VERSION,
				),
			),
			'Version'      => array(
				'option_name'    => 'version',
				'option_value'   => '7',
				'stored_options' => array(
					'admin_bar'    => true,
					'roles'        => array(
						'administrator',
					),
					'count_roles'  => array(),
					'do_not_track' => true,
					'blog_id'      => 1234,
					'version'      => self::DEFAULT_STATS_VERSION,
				),
			),
			'Honor DNT'    => array(
				'option_name'    => 'do_not_track',
				'option_value'   => false,
				'stored_options' => array(
					'admin_bar'    => true,
					'roles'        => array(
						'administrator',
					),
					'count_roles'  => array(),
					'do_not_track' => false,
					'blog_id'      => 1234,
					'version'      => self::DEFAULT_STATS_VERSION,
				),
			),
			'Dummy option' => array(
				'option_name'    => 'dummy',
				'option_value'   => 'dummy',
				'stored_options' => array(
					'admin_bar'    => true,
					'roles'        => array(
						'administrator',
					),
					'count_roles'  => array(),
					'do_not_track' => true,
					'blog_id'      => 1234,
					'version'      => self::DEFAULT_STATS_VERSION,
				),
			),
		);
	}

	/**
	 * Test for Options::set_option
	 *
	 * @dataProvider statsSetOptionDataProvider
	 *
	 * @param string $option_name    The Stats option name to set.
	 * @param mixed  $option_value   The Stats option value.
	 * @param mixed  $stored_options The expected Stats stored options.
	 */
	public function test_set_option( $option_name, $option_value, $stored_options ) {
		$this->assertTrue( Options::set_option( $option_name, $option_value ) );
		$this->assertSame( $stored_options, get_option( 'stats_options' ) );
	}
}
