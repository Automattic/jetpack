<?php
/**
 * Git shell commands
 *
 * @package automattic/jetpack-scripts
 */

namespace Automattic\Jetpack\Scripts;

/**
 * Wrapper around some git commands
 */
class Git_Shell_Command {
	/**
	 * Constructor!
	 *
	 * @param String $name repository name.
	 */
	public function __construct( $name ) {
		$this->name    = $name;
		$this->path    = explode( '/', $name )[1];
		$this->dir_arg = "--git-dir=$this->path/.git";
	}

	/**
	 * Returns the latest repo tag
	 */
	public function get_latest_tag() {
		$cmd    = "git $this->dir_arg describe --abbrev=0";
		$result = Cmd::run( $cmd );

		return $result['output'];
	}

	/**
	 * Returns a `shortstat` diff between two tags
	 *
	 * @param String $source git tag or branch.
	 * @param String $target git tag or branch.
	 */
	public function get_diff_between( $source, $target ) {
		$cmd    = "git $this->dir_arg diff $source $target --shortstat";
		$result = Cmd::run( $cmd );

		return $result['output'];
	}

	/**
	 * Clones a repository
	 *
	 * @param String $type URL type to use.
	 */
	public function clone_repository( $type = 'ssh' ) {
		if ( 'ssh' === $type ) {
			$url = "git@github.com:$this->name.git";
		} else {
			$url = "https://github.com/$this->name.git";

		}
		Cmd::run( "rm -rf $this->path" );

		$cmd    = "git clone $url 2>&1";
		$result = Cmd::run( $cmd );

		return $result['output'];
	}

	/**
	 * Checkout to a new branch
	 *
	 * @param String $branch branch name.
	 */
	public function checkout_new_branch( $branch ) {
		$cmd    = "git $this->dir_arg checkout -b release-$branch 2>&1";
		$result = Cmd::run( $cmd );

		return $result['output'];
	}
}
