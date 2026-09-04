<?php
/**
 * Plan matrix for the product cards' primary action.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\My_Jetpack\Products\Anti_Spam;
use Automattic\Jetpack\My_Jetpack\Products\Backup;
use Automattic\Jetpack\My_Jetpack\Products\Boost;
use Automattic\Jetpack\My_Jetpack\Products\Crm;
use Automattic\Jetpack\My_Jetpack\Products\Jetpack_Ai;
use Automattic\Jetpack\My_Jetpack\Products\Jetpack_Forms;
use Automattic\Jetpack\My_Jetpack\Products\Protect;
use Automattic\Jetpack\My_Jetpack\Products\Search;
use Automattic\Jetpack\My_Jetpack\Products\Social;
use Automattic\Jetpack\My_Jetpack\Products\Stats;
use Automattic\Jetpack\My_Jetpack\Products\Videopress;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\CoversMethod;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

/**
 * Drives Product::get_status() across the plan matrix.
 *
 * The status asserted here is the value the REST API ships to the Products page, which
 * the card turns into its primary action. The status-to-action half of that contract is
 * covered by _inc/components/action-button/test/plan-matrix.test.tsx, and the two halves
 * are pinned to a shared vocabulary by Status_Vocabulary_Parity_Test.
 *
 * Runs in its own process: get_site_features_from_wpcom() memoizes its answer in a static,
 * so any earlier test class that reaches it without a seeded transient answers this one too.
 *
 * @covers \Automattic\Jetpack\My_Jetpack\Product::get_status
 *
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[CoversMethod( Product::class, 'get_status' )]
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class Plan_Matrix_Test extends TestCase {

	/**
	 * No plan of any kind covers the product.
	 */
	private const OWNERSHIP_NONE = 'none';

	/**
	 * The product is covered by a bundle the site owns, such as Complete.
	 */
	private const OWNERSHIP_BUNDLE = 'bundle';

	/**
	 * The site owns the product's own paid plan directly.
	 */
	private const OWNERSHIP_DIRECT = 'direct';

	/**
	 * The product's standalone plugin is not installed at all.
	 */
	private const ACTIVATION_PLUGIN_ABSENT = 'plugin_absent';

	/**
	 * Everything the product needs is installed, but the product is switched off.
	 */
	private const ACTIVATION_OFF = 'off';

	/**
	 * The product is installed and switched on.
	 */
	private const ACTIVATION_ON = 'on';

	/**
	 * Standalone mock plugin assets, keyed by the product's $plugin_slug.
	 *
	 * @var array<string, string>
	 */
	private const STANDALONE_MOCKS = array(
		'akismet'            => 'akismet-mock-plugin.txt',
		'jetpack-backup'     => 'backup-mock-plugin.txt',
		'jetpack-boost'      => 'boost-mock-plugin.txt',
		'zero-bs-crm'        => 'crm-mock-plugin.txt',
		'jetpack-protect'    => 'protect-mock-plugin.txt',
		'jetpack-search'     => 'search-mock-plugin.txt',
		'jetpack-social'     => 'social-mock-plugin.txt',
		'jetpack-videopress' => 'videopress-mock-plugin.txt',
	);

	/**
	 * Jetpack modules that must be registered as available before Modules::get_active()
	 * will report any of them as active.
	 *
	 * @var array<string, string>
	 */
	private const AVAILABLE_MODULES = array(
		'ai'           => '1.0',
		'contact-form' => '1.0',
		'protect'      => '1.0',
		'publicize'    => '1.0',
		'search'       => '1.0',
		'stats'        => '1.0',
		'videopress'   => '1.0',
	);

	/**
	 * The status each cell of the plan matrix must produce, keyed by
	 * "<product> => <ownership>/<activation>".
	 *
	 * Ownership is the axis the upsell bug lives on: a bundle owner and a direct-plan owner
	 * are the same customer as far as a product card is concerned, so their rows must match.
	 *
	 * @var array<string, array<string, string>>
	 */
	private const MATRIX = array(
		'anti-spam'     => array(
			'none/plugin_absent'   => Products::STATUS_PLUGIN_ABSENT,
			'none/off'             => Products::STATUS_NEEDS_ACTIVATION,
			'none/on'              => Products::STATUS_CAN_UPGRADE,
			'bundle/plugin_absent' => Products::STATUS_PLUGIN_ABSENT_WITH_PLAN,
			'bundle/off'           => Products::STATUS_INACTIVE,
			'bundle/on'            => Products::STATUS_ACTIVE,
			'direct/plugin_absent' => Products::STATUS_PLUGIN_ABSENT_WITH_PLAN,
			'direct/off'           => Products::STATUS_INACTIVE,
			'direct/on'            => Products::STATUS_ACTIVE,
		),
		// Backup runs from the Jetpack plugin, so its standalone plugin's state never gates it.
		'backup'        => array(
			'none/plugin_absent'   => Products::STATUS_NEEDS_PLAN,
			'none/off'             => Products::STATUS_NEEDS_PLAN,
			'none/on'              => Products::STATUS_NEEDS_PLAN,
			'bundle/plugin_absent' => Products::STATUS_ACTIVE,
			'bundle/off'           => Products::STATUS_ACTIVE,
			'bundle/on'            => Products::STATUS_ACTIVE,
			'direct/plugin_absent' => Products::STATUS_ACTIVE,
			'direct/off'           => Products::STATUS_ACTIVE,
			'direct/on'            => Products::STATUS_ACTIVE,
		),
		'boost'         => array(
			'none/plugin_absent'   => Products::STATUS_PLUGIN_ABSENT,
			'none/off'             => Products::STATUS_NEEDS_ACTIVATION,
			'none/on'              => Products::STATUS_CAN_UPGRADE,
			'bundle/plugin_absent' => Products::STATUS_PLUGIN_ABSENT_WITH_PLAN,
			'bundle/off'           => Products::STATUS_INACTIVE,
			'bundle/on'            => Products::STATUS_ACTIVE,
			'direct/plugin_absent' => Products::STATUS_PLUGIN_ABSENT_WITH_PLAN,
			'direct/off'           => Products::STATUS_INACTIVE,
			'direct/on'            => Products::STATUS_ACTIVE,
		),
		'crm'           => array(
			'none/plugin_absent'   => Products::STATUS_PLUGIN_ABSENT,
			'none/off'             => Products::STATUS_NEEDS_ACTIVATION,
			'none/on'              => Products::STATUS_CAN_UPGRADE,
			'bundle/plugin_absent' => Products::STATUS_PLUGIN_ABSENT_WITH_PLAN,
			'bundle/off'           => Products::STATUS_INACTIVE,
			'bundle/on'            => Products::STATUS_ACTIVE,
		),
		'jetpack-ai'    => array(
			'none/plugin_absent'   => Products::STATUS_MODULE_DISABLED,
			'none/off'             => Products::STATUS_MODULE_DISABLED,
			'none/on'              => Products::STATUS_ACTIVE,
			'bundle/plugin_absent' => Products::STATUS_MODULE_DISABLED,
			'bundle/off'           => Products::STATUS_MODULE_DISABLED,
			'bundle/on'            => Products::STATUS_ACTIVE,
			'direct/plugin_absent' => Products::STATUS_MODULE_DISABLED,
			'direct/off'           => Products::STATUS_MODULE_DISABLED,
			'direct/on'            => Products::STATUS_ACTIVE,
		),
		'jetpack-forms' => array(
			'none/plugin_absent'   => Products::STATUS_MODULE_DISABLED,
			'none/off'             => Products::STATUS_MODULE_DISABLED,
			'none/on'              => Products::STATUS_ACTIVE,
			'bundle/plugin_absent' => Products::STATUS_MODULE_DISABLED,
			'bundle/off'           => Products::STATUS_MODULE_DISABLED,
			'bundle/on'            => Products::STATUS_ACTIVE,
		),
		'protect'       => array(
			'none/plugin_absent'   => Products::STATUS_NEEDS_PLAN,
			'none/off'             => Products::STATUS_NEEDS_ACTIVATION,
			'none/on'              => Products::STATUS_CAN_UPGRADE,
			'bundle/plugin_absent' => Products::STATUS_MODULE_DISABLED,
			'bundle/off'           => Products::STATUS_MODULE_DISABLED,
			'bundle/on'            => Products::STATUS_ACTIVE,
			'direct/plugin_absent' => Products::STATUS_MODULE_DISABLED,
			'direct/off'           => Products::STATUS_MODULE_DISABLED,
			'direct/on'            => Products::STATUS_ACTIVE,
		),
		'search'        => array(
			'none/plugin_absent'   => Products::STATUS_NEEDS_PLAN,
			'none/off'             => Products::STATUS_NEEDS_PLAN,
			'none/on'              => Products::STATUS_NEEDS_PLAN,
			'bundle/plugin_absent' => Products::STATUS_MODULE_DISABLED,
			'bundle/off'           => Products::STATUS_MODULE_DISABLED,
			'bundle/on'            => Products::STATUS_ACTIVE,
			'direct/plugin_absent' => Products::STATUS_MODULE_DISABLED,
			'direct/off'           => Products::STATUS_MODULE_DISABLED,
			'direct/on'            => Products::STATUS_ACTIVE,
		),
		'social'        => array(
			'none/plugin_absent'   => Products::STATUS_NEEDS_ACTIVATION,
			'none/off'             => Products::STATUS_NEEDS_ACTIVATION,
			'none/on'              => Products::STATUS_CAN_UPGRADE,
			'bundle/plugin_absent' => Products::STATUS_MODULE_DISABLED,
			'bundle/off'           => Products::STATUS_MODULE_DISABLED,
			'bundle/on'            => Products::STATUS_ACTIVE,
			'direct/plugin_absent' => Products::STATUS_MODULE_DISABLED,
			'direct/off'           => Products::STATUS_MODULE_DISABLED,
			'direct/on'            => Products::STATUS_ACTIVE,
		),
		'stats'         => array(
			'none/plugin_absent'   => Products::STATUS_MODULE_DISABLED,
			'none/off'             => Products::STATUS_MODULE_DISABLED,
			'none/on'              => Products::STATUS_CAN_UPGRADE,
			'bundle/plugin_absent' => Products::STATUS_MODULE_DISABLED,
			'bundle/off'           => Products::STATUS_MODULE_DISABLED,
			'bundle/on'            => Products::STATUS_ACTIVE,
			'direct/plugin_absent' => Products::STATUS_MODULE_DISABLED,
			'direct/off'           => Products::STATUS_MODULE_DISABLED,
			'direct/on'            => Products::STATUS_ACTIVE,
		),
		'videopress'    => array(
			'none/plugin_absent'   => Products::STATUS_NEEDS_PLAN,
			'none/off'             => Products::STATUS_NEEDS_ACTIVATION,
			'none/on'              => Products::STATUS_CAN_UPGRADE,
			'bundle/plugin_absent' => Products::STATUS_MODULE_DISABLED,
			'bundle/off'           => Products::STATUS_MODULE_DISABLED,
			'bundle/on'            => Products::STATUS_ACTIVE,
			'direct/plugin_absent' => Products::STATUS_MODULE_DISABLED,
			'direct/off'           => Products::STATUS_MODULE_DISABLED,
			'direct/on'            => Products::STATUS_ACTIVE,
		),
	);

	/**
	 * Cells the matrix does not hold today, and the issue that will make them hold.
	 *
	 * Search declares $requires_plan, and get_status() reads that flag before it reads
	 * whether a plan exists -- so an owner whose module is off is told to buy the plan
	 * they already have.
	 *
	 * @var array<string, string>
	 */
	private const KNOWN_BROKEN = array(
		'search / bundle / plugin_absent' => 'JETPACK-2528',
		'search / bundle / off'           => 'JETPACK-2528',
		'search / direct / plugin_absent' => 'JETPACK-2528',
		'search / direct / off'           => 'JETPACK-2528',
	);

	/**
	 * Every product that renders a card on the Products page.
	 *
	 * @return array<string, class-string<Product>>
	 */
	private static function card_products(): array {
		return array(
			'anti-spam'     => Anti_Spam::class,
			'backup'        => Backup::class,
			'boost'         => Boost::class,
			'crm'           => Crm::class,
			'jetpack-ai'    => Jetpack_Ai::class,
			'jetpack-forms' => Jetpack_Forms::class,
			'protect'       => Protect::class,
			'search'        => Search::class,
			'social'        => Social::class,
			'stats'         => Stats::class,
			'videopress'    => Videopress::class,
		);
	}

	/**
	 * Set up a connected site with the Jetpack plugin installed and active.
	 */
	public function setUp(): void {
		parent::setUp();

		// Other test classes install standalone plugins and leave them behind, which would
		// answer this matrix's "plugin absent" cells.
		$this->uninstall_standalone_plugins();

		$this->install_jetpack_plugin();
		require_once WP_PLUGIN_DIR . '/jetpack/jetpack.php';

		$user_id = wp_insert_user(
			array(
				'user_login' => 'test_admin',
				'user_pass'  => '123',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );

		( new Tokens() )->update_blog_token( 'test.test.1' );
		( new Tokens() )->update_user_token( $user_id, 'test.test.' . $user_id, true );
		Jetpack_Options::update_option( 'id', 123 );
		Jetpack_Options::update_option( 'available_modules', array( JETPACK__VERSION => self::AVAILABLE_MODULES ) );

		/*
		 * get_site_features_from_wpcom() memoizes a WP_Error in a static on its first failed
		 * HTTP attempt, so seed the transient before any product in the process reads it.
		 */
		$this->set_site_features( array() );

		activate_plugin( 'jetpack/jetpack.php' );
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		$this->uninstall_standalone_plugins();
		\Jetpack::$active_modules = array();

		delete_transient( Product::MY_JETPACK_SITE_FEATURES_TRANSIENT_KEY );
		delete_transient( Wpcom_Products::MY_JETPACK_PURCHASES_TRANSIENT_KEY );
		delete_transient( Backup::BACKUP_STATUS_TRANSIENT_KEY );

		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();

		parent::tearDown();
	}

	/**
	 * The status the Products page shows for one cell of the plan matrix.
	 *
	 * @param string $slug       Product slug.
	 * @param string $ownership  One of the OWNERSHIP_* constants.
	 * @param string $activation One of the ACTIVATION_* constants.
	 * @param string $expected   The status the card needs in order to offer the right action.
	 *
	 * @dataProvider provide_matrix
	 */
	#[DataProvider( 'provide_matrix' )]
	public function test_status_across_the_plan_matrix( string $slug, string $ownership, string $activation, string $expected ) {
		$class = self::card_products()[ $slug ];
		$this->apply_state( $class, $ownership, $activation );

		$actual = $class::get_status();
		$broken = self::KNOWN_BROKEN[ "$slug / $ownership / $activation" ] ?? null;

		if ( null !== $broken ) {
			$this->assertNotSame(
				$expected,
				$actual,
				'This cell is recorded as broken, but get_status() now returns the expected status. Drop it from KNOWN_BROKEN so the matrix starts enforcing it.'
			);
			$this->markTestIncomplete( "Returns '$actual' where the card needs '$expected'. Fixed by $broken." );
		}

		$this->assertSame( $expected, $actual );
	}

	/**
	 * The project's correctness metric, stated against the matrix itself: an owner is never
	 * told to buy. Without this, a future failure could be "fixed" by relaxing a cell back to
	 * an upsell status, and the matrix would go green having lost the thing it exists to check.
	 */
	public function test_owners_never_expect_an_upsell_status() {
		$upsell_statuses = array( Products::STATUS_NEEDS_PLAN, Products::STATUS_PLUGIN_ABSENT );

		foreach ( self::MATRIX as $slug => $cells ) {
			foreach ( $cells as $state => $expected ) {
				if ( 0 === strpos( $state, self::OWNERSHIP_NONE . '/' ) ) {
					continue;
				}

				$this->assertNotContains( $expected, $upsell_statuses, "$slug / $state expects an upsell status for a site that owns the product." );
			}
		}
	}

	/**
	 * Every cell of the plan matrix, with the status the card needs to offer the right action.
	 *
	 * @return iterable<string, array{0: string, 1: string, 2: string, 3: string}>
	 */
	public static function provide_matrix(): iterable {
		foreach ( self::MATRIX as $slug => $cells ) {
			foreach ( $cells as $state => $expected ) {
				list( $ownership, $activation ) = explode( '/', $state );
				yield "$slug / $ownership / $activation" => array( $slug, $ownership, $activation, $expected );
			}
		}
	}

	/**
	 * Put the site into the requested ownership and activation state for one product.
	 *
	 * @param string $class      Product class name.
	 * @param string $ownership  One of the OWNERSHIP_* constants.
	 * @param string $activation One of the ACTIVATION_* constants.
	 */
	private function apply_state( string $class, string $ownership, string $activation ) {
		$this->apply_ownership( $class, $ownership );

		if ( self::ACTIVATION_PLUGIN_ABSENT !== $activation ) {
			$this->install_standalone_plugin( $class );
		}

		if ( self::ACTIVATION_ON === $activation ) {
			$this->activate_standalone_plugin( $class );
			$this->activate_module( $class );
		}

		// Backup reads a separate transient for its health; a clean one keeps the
		// NEEDS_ATTENTION statuses from masking what the plan matrix produces.
		set_transient( Backup::BACKUP_STATUS_TRANSIENT_KEY, 'no_errors', HOUR_IN_SECONDS );
	}

	/**
	 * Seed the site features and purchases that make a product owned or unowned.
	 *
	 * @param string $class     Product class name.
	 * @param string $ownership One of the OWNERSHIP_* constants.
	 */
	private function apply_ownership( string $class, string $ownership ) {
		if ( self::OWNERSHIP_NONE === $ownership ) {
			$this->set_site_features( array() );
			return;
		}

		/*
		 * wpcom reports the features a plan grants whether it is the product's own plan or a
		 * bundle, so both owned cases seed the same feature and differ only in the purchase.
		 */
		$this->set_site_features( array_filter( array( $class::$feature_identifying_paid_plan ) ) );

		$direct_plans = $class::get_paid_plan_product_slugs();
		$product_slug = self::OWNERSHIP_BUNDLE === $ownership ? 'jetpack_complete' : reset( $direct_plans );

		set_transient(
			Wpcom_Products::MY_JETPACK_PURCHASES_TRANSIENT_KEY,
			array(
				(object) array(
					'product_slug'  => $product_slug,
					'expiry_status' => 'active',
					'expiry_date'   => gmdate( 'Y-m-d H:i:s', strtotime( '+1 year' ) ),
				),
			),
			HOUR_IN_SECONDS
		);
	}

	/**
	 * Seed the site features transient.
	 *
	 * @param array<string> $active Feature slugs the site's plan grants.
	 */
	private function set_site_features( array $active ) {
		set_transient(
			Product::MY_JETPACK_SITE_FEATURES_TRANSIENT_KEY,
			array(
				'active'    => $active,
				// Left empty so get_paid_bundles_that_include_product() returns before
				// reaching Current_Plan::refresh_from_wpcom() and its HTTP request.
				'available' => array(),
			),
			HOUR_IN_SECONDS
		);
	}

	/**
	 * Copy the Jetpack mock plugin into place.
	 */
	private function install_jetpack_plugin() {
		if ( ! file_exists( WP_PLUGIN_DIR . '/jetpack' ) ) {
			mkdir( WP_PLUGIN_DIR . '/jetpack', 0777, true );
		}
		copy( __DIR__ . '/assets/jetpack-mock-plugin.txt', WP_PLUGIN_DIR . '/jetpack/jetpack.php' );
		wp_cache_delete( 'plugins', 'plugins' );
	}

	/**
	 * Copy a product's standalone mock plugin into place, if it has one.
	 *
	 * @param string $class Product class name.
	 */
	private function install_standalone_plugin( string $class ) {
		$filename = $this->standalone_filename( $class );
		if ( null === $filename ) {
			return;
		}

		$target = WP_PLUGIN_DIR . '/' . $filename;
		if ( ! file_exists( dirname( $target ) ) ) {
			mkdir( dirname( $target ), 0777, true );
		}
		copy( __DIR__ . '/assets/' . self::STANDALONE_MOCKS[ $class::$plugin_slug ], $target );
		wp_cache_delete( 'plugins', 'plugins' );
	}

	/**
	 * Activate a product's standalone plugin, if it has one installed.
	 *
	 * @param string $class Product class name.
	 */
	private function activate_standalone_plugin( string $class ) {
		$filename = $this->standalone_filename( $class );
		if ( null !== $filename ) {
			activate_plugin( $filename );
		}
	}

	/**
	 * Switch a product's Jetpack module on, in both places a module's state is read:
	 * the option that Modules::is_active() consults for Hybrid_Product, and the mock
	 * Jetpack class that Module_Product::is_module_active() consults.
	 *
	 * @param string $class Product class name.
	 */
	private function activate_module( string $class ) {
		if ( ! $class::$module_name ) {
			return;
		}

		$active = Jetpack_Options::get_option( 'active_modules', array() );
		if ( ! in_array( $class::$module_name, $active, true ) ) {
			$active[] = $class::$module_name;
		}
		Jetpack_Options::update_option( 'active_modules', $active );

		\Jetpack::$active_modules[] = $class::$module_name;
	}

	/**
	 * The first declared filename for a product's standalone plugin, or null when the
	 * product ships only inside the Jetpack plugin.
	 *
	 * @param string $class Product class name.
	 * @return string|null
	 */
	private function standalone_filename( string $class ): ?string {
		$filenames = $this->standalone_filenames( $class );
		return $filenames ? reset( $filenames ) : null;
	}

	/**
	 * Every filename a product's standalone plugin can be installed under. Products declare
	 * several, and other test classes install them under names this one does not pick.
	 *
	 * @param string $class Product class name.
	 * @return array<string>
	 */
	private function standalone_filenames( string $class ): array {
		$plugin_slug = $class::$plugin_slug;
		if ( ! $plugin_slug || ! isset( self::STANDALONE_MOCKS[ $plugin_slug ] ) ) {
			return array();
		}

		return (array) $class::$plugin_filename;
	}

	/**
	 * Remove every standalone mock plugin, so an "absent" cell in one test isn't
	 * answered by a file another test left behind.
	 */
	private function uninstall_standalone_plugins() {
		foreach ( self::card_products() as $class ) {
			foreach ( $this->standalone_filenames( $class ) as $filename ) {
				$target = WP_PLUGIN_DIR . '/' . $filename;
				if ( file_exists( $target ) ) {
					unlink( $target );
				}
			}
		}
		wp_cache_delete( 'plugins', 'plugins' );
	}
}
