<?php
/**
 * Set of scripts for Jetpack.
 *
 * @package automattic/jetpack-scripts
 */

namespace Automattic\Jetpack\Scripts;

/**
 * Package release handler
 */
class Release {
	/**
	 * List of update statuses for dependencies
	 *
	 * @var Array
	 */
	private $update_statuses = array();

	/**
	 * Sets a logger
	 */
	public function __construct() {
		$this->logger = new Logger();
	}

	/**
	 * Class entry point. Called externally via composer script
	 */
	public static function run() {
		$release = new Release();
		Logger::info( 'Doing stuff...' );
		$root = Dependency_Tree::generate();
		Logger::log( $root );

		$list = $release->get_package_dependencies_to_update( $root );

		if ( ! empty( $list ) ) {
			$release->handle_dependencies_updates( $list );
		}

		$release->handle_package_update( $root['name'] );

		Logger::info( 'Done with running!' );
	}

	/**
	 * Handles root package update
	 *
	 * @param String $name package name.
	 */
	public function handle_package_update( $name ) {
		$sh = new Git_Shell_Command( $name );

		$sh->clone_repository();

		$tag  = $sh->get_latest_tag();
		$diff = $sh->get_diff_between( $tag, 'master' );

		if ( $this->is_update_requested( $name, $tag, $diff ) ) {
			$this->do_dependency_update( $name );
		}
	}

	/**
	 * Checks if user requested an update
	 *
	 * @param String $name repo name.
	 * @param String $tag latest released version.
	 * @param String $diff short diff of unreleased changes.
	 */
	public function is_update_requested( $name, $tag, $diff ) {
		Logger::log( "Package name: $name", 'blue' );
		Logger::log( "Latest stable version: $tag", 'blue' );
		Logger::log( "Unreleased changes: $diff", 'blue' );

		return $this->handle_polar_question( 'Do you want to update this package [y/n]? ' );
	}

	/**
	 * Loops through provided list of dependencies and tries to update them
	 *
	 * @param Array $list list of dependencies.
	 */
	public function handle_dependencies_updates( $list ) {
		Logger::info( 'Here is the list of dependencies with some unreleased changes:' );
		Logger::log( $list, 1 );

		foreach ( $list as $dep ) {
			if ( $this->is_update_requested( $dep[0], $dep[2], $dep[1] ) ) {
				$this->do_dependency_update( $dep[0] );
			}
		}
	}

	/**
	 * Run an actual package update
	 *
	 * @param String $name package name.
	 * @throws \Exception Invalid provided version.
	 */
	public function do_dependency_update( $name ) {
		Logger::info( "Updating dependency: $name" );

		$prompt = $this->logger->get_colored_string(
			'Please provide a version number that should be used for new release in SemVer format (x.x.x): ',
			'green'
		);

		$version = readline( $prompt );

		if ( 3 !== count( explode( '.', $version ) ) ) {
			throw new \Exception( "$version is not in a SemVer format" );
		}

		$version = 'v' . $version;
		$branch  = "release-$version";

		$sh = new Git_Shell_Command( $name );
		$sh->clone_repository();
		$sh->checkout_new_branch( $branch );

		return true;
	}

	/**
	 * Prompts a polar (Y/N) question to a user, and returns a bool
	 *
	 * @param String $prompt question to ask.
	 * @throws \Exception Invalid response.
	 */
	public function handle_polar_question( $prompt ) {
		$in = readline( $this->logger->get_colored_string( $prompt, 'green' ) );

		if ( 'y' === $in || 'Y' === $in ) {
			return true;
		} elseif ( 'n' === $in || 'N' === $in ) {
			return false;
		} else {
			throw new \Exception( 'Invalid response. Expected Y/y/N/n' );
		}
	}


	/**
	 * Checks wether a package have some unreleased changes
	 *
	 * @param String $name repository name.
	 */
	public function is_update_possible( $name ) {
		/**
		 * Inside $name repository:
		 * - get latest tag: `git describe --abbrev=0`
		 * - compare tag against master: `git diff $tag master --shortstat`
		 * - if output is not empty - there is a difference
		 */

		if ( array_key_exists( $name, $this->update_statuses ) ) {
			return $this->update_statuses[ $name ];
		}

		$sh = new Git_Shell_Command( $name );
		$sh->clone_repository();
		$tag = $sh->get_latest_tag();
		$out = $sh->get_diff_between( $tag, 'master' );

		$result = array(
			'status' => true,
			'diff'   => $out,
			'tag'    => $tag,
		);
		if ( 0 === strlen( $out ) ) {
			$result['status'] = false;
		}

		$this->update_statuses[ $name ] = $result;
		return $result;
	}

	/**
	 * Walks through the dependency tree and builds a list of deps that needs to be updated
	 * This list is build in order from branch up to root, meaning it is the order that could be used for updating the whole tree in single run
	 *
	 * @param Array $object tree node.
	 */
	public function get_package_dependencies_to_update( $object ) {
		$object_requires = $object['requires'];
		$deps_to_update  = array();

		foreach ( $object_requires as $dependency ) {
			// Check if we need to update this package.
			$update = $this->is_update_possible( $dependency['name'] );
			if ( $update['status'] ) {
				array_unshift( $deps_to_update, array( $dependency['name'], $update['diff'], $update['tag'] ) );
				if ( array_key_exists( 'requires', $dependency ) ) {
					// $dependency have dependencies, lets recursively go through them too.
					$deps = $this->get_package_dependencies_to_update( $dependency );
					array_merge( $deps, $deps_to_update );
				}
			}
		}

		return $deps_to_update;
	}
}
