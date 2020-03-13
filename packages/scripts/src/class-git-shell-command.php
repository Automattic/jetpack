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
		$this->dir_arg = "--git-dir=$this->path/.git --work-tree=$this->path";
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
		$cmd    = "git $this->dir_arg checkout -q -b $branch 2>&1";
		$result = Cmd::run( $cmd );

		return $result['output'];
	}

	/**
	 * Tag new version
	 *
	 * @param String $name tag name.
	 */
	public function tag_new_version( $name ) {
		$cmd    = "git $this->dir_arg tag -a $name -m 'New release for $name' 2>&1";
		$result = Cmd::run( $cmd );

		return $result['output'];
	}

	/**
	 * Get status
	 */
	public function status() {
		$result = Cmd::run( "git $this->dir_arg status --porcelain --untracked-files=no" );

		return $result['output'];
	}

	/**
	 * Commit all changes
	 */
	public function commit() {
		$result = Cmd::run( "git $this->dir_arg commit -a -m 'Add changes'" );

		return $result['output'];
	}

	/**
	 * Checkout to a new branch
	 *
	 * @param String $branch branch name.
	 */
	public function push_to_remote( $branch ) {
		$cmd    = "git $this->dir_arg push --set-upstream origin $branch 2>&1";
		$result = Cmd::run( $cmd );

		$cmd    = "git $this->dir_arg push origin --tags 2>&1";
		$result = Cmd::run( $cmd );

		return $result['output'];
	}
}
