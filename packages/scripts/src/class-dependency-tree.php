<?php
/**
 * Extended Composer's ShowCommand to get access to
 *
 * @package automattic/jetpack-scripts
 */

namespace Automattic\Jetpack\Scripts;

use Composer\Console\Application;
use Composer\Command\ShowCommand;
use Composer\Package\Version\VersionParser;

/**
 * Extended Composer's ShowCommand to get access to
 */
class Dependency_Tree extends ShowCommand {
	/**
	 * Composer instance
	 *
	 * @var Composer|null
	 */
	private $composer;

	/**
	 * Simple constructor
	 */
	public function __construct() {
		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		$this->versionParser = new VersionParser();
	}

	/**
	 * Returns Composer instance
	 */
	public function get_composer() {
		if ( null === $this->composer ) {
			$application    = new Application();
			$this->composer = $application->getComposer( true, null );
		}

		return $this->composer;
	}

	/**
	 * Generates a dependency tree
	 */
	public static function generate() {
		$it             = new Dependency_Tree();
		$package        = $it->get_composer()->getPackage();
		$repos          = $it->get_composer()->getRepositoryManager()->getLocalRepository();
		$installed_repo = $repos;

		$array_tree = $it->generatePackageTree( $package, $installed_repo, $repos );

		return $array_tree;
	}
}
