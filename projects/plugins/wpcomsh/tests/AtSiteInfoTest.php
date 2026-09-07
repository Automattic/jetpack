<?php
/**
 * At Site Info Test file.
 *
 * @package wpcomsh
 */

/**
 * Class AtSiteInfoTest.
 *
 * @covers ::wpcomsh_get_at_site_info
 */
#[PHPUnit\Framework\Attributes\CoversFunction( 'wpcomsh_get_at_site_info' )]
class AtSiteInfoTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Path to the platform snapshot read by wpcomsh_get_at_site_info().
	 *
	 * @var string
	 */
	private $site_info_file;

	/**
	 * Contents of a pre-existing snapshot, restored on teardown.
	 *
	 * @var string|null
	 */
	private $original_site_info;

	/**
	 * Set up.
	 */
	public function setUp(): void {
		parent::setUp();

		$this->site_info_file     = sys_get_temp_dir() . '/.at-site-info';
		$this->original_site_info = is_file( $this->site_info_file )
			? file_get_contents( $this->site_info_file ) // phpcs:ignore WordPress.WP.AlternativeFunctions
			: null;
	}

	/**
	 * Tear down.
	 */
	public function tearDown(): void {
		if ( $this->original_site_info === null ) {
			if ( is_file( $this->site_info_file ) ) {
				unlink( $this->site_info_file );
			}
		} else {
			file_put_contents( $this->site_info_file, $this->original_site_info ); // phpcs:ignore WordPress.WP.AlternativeFunctions
		}

		Atomic_Persistent_Data::delete( 'WPCOM_SPACE_QUOTA_BYTES' );

		parent::tearDown();
	}

	/**
	 * Write a platform snapshot holding the given byte counts.
	 *
	 * @param int $space_used  Bytes used.
	 * @param int $space_quota Bytes allowed.
	 */
	private function write_snapshot( $space_used, $space_quota ) {
		file_put_contents( // phpcs:ignore WordPress.WP.AlternativeFunctions
			$this->site_info_file,
			wp_json_encode(
				array(
					'space_used'  => $space_used,
					'space_quota' => $space_quota,
				),
				JSON_UNESCAPED_SLASHES
			)
		);
	}

	/**
	 * A pushed quota replaces the one in the snapshot.
	 */
	public function test_pushed_quota_overrides_snapshot_quota() {
		$this->write_snapshot( 5 * GB_IN_BYTES, 6 * GB_IN_BYTES );
		Atomic_Persistent_Data::set( 'WPCOM_SPACE_QUOTA_BYTES', (string) ( 56 * GB_IN_BYTES ) );

		$site_info = wpcomsh_get_at_site_info();

		$this->assertSame( 56 * GB_IN_BYTES, $site_info['space_quota'] );
	}

	/**
	 * The space_used value always comes from the snapshot, never from persistent data.
	 */
	public function test_space_used_is_left_alone() {
		$this->write_snapshot( 5 * GB_IN_BYTES, 6 * GB_IN_BYTES );
		Atomic_Persistent_Data::set( 'WPCOM_SPACE_QUOTA_BYTES', (string) ( 56 * GB_IN_BYTES ) );

		$site_info = wpcomsh_get_at_site_info();

		$this->assertSame( 5 * GB_IN_BYTES, $site_info['space_used'] );
	}

	/**
	 * Unusable pushed values leave the snapshot exactly as it was.
	 *
	 * @dataProvider provide_unusable_pushed_quotas
	 *
	 * @param string|null $pushed_quota The value in persistent data.
	 */
	#[PHPUnit\Framework\Attributes\DataProvider( 'provide_unusable_pushed_quotas' )]
	public function test_unusable_pushed_quota_keeps_snapshot( $pushed_quota ) {
		$this->write_snapshot( 5 * GB_IN_BYTES, 6 * GB_IN_BYTES );

		if ( $pushed_quota !== null ) {
			Atomic_Persistent_Data::set( 'WPCOM_SPACE_QUOTA_BYTES', $pushed_quota );
		}

		$site_info = wpcomsh_get_at_site_info();

		$this->assertSame( 6 * GB_IN_BYTES, $site_info['space_quota'] );
	}

	/**
	 * Pushed values that must not be trusted.
	 *
	 * @return array<string, array{0: string|null}>
	 */
	public static function provide_unusable_pushed_quotas() {
		return array(
			'absent'      => array( null ),
			'empty'       => array( '' ),
			'non-numeric' => array( 'unlimited' ),
			'zero'        => array( '0' ),
			'negative'    => array( '-1' ),
		);
	}

	/**
	 * A missing snapshot is still an empty result, pushed quota or not.
	 */
	public function test_missing_snapshot_returns_empty_array() {
		if ( is_file( $this->site_info_file ) ) {
			unlink( $this->site_info_file );
		}
		Atomic_Persistent_Data::set( 'WPCOM_SPACE_QUOTA_BYTES', (string) ( 56 * GB_IN_BYTES ) );

		$this->assertSame( array(), wpcomsh_get_at_site_info() );
	}
}
