<?php
/**
 * Trait for changelogger plugin boilerplate.
 *
 * @package automattic/jetpack-changelogger
 */

namespace Automattic\Jetpack\Changelogger;

use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * Trait for changelogger plugin boilerplate.
 */
trait PluginTrait {

	/**
	 * InputInterface.
	 *
	 * @var InputInterface|null
	 */
	protected $input;

	/**
	 * OutputInterface.
	 *
	 * @var OutputInterface|null
	 */
	protected $output;

	/**
	 * Instantiate the plugin.
	 *
	 * @param array $config Configuration information from composer.json.
	 */
	public static function instantiate( array $config ) {
		return new static( $config );
	}

	/**
	 * Define any command line options the versioning plugin wants to accept.
	 *
	 * @return InputOption[]
	 */
	public function getOptions() {
		return array();
	}

	/**
	 * Set Symfony Console input and output interfaces.
	 *
	 * @param InputInterface  $input InputInterface.
	 * @param OutputInterface $output OutputInterface.
	 */
	public function setIO( InputInterface $input, OutputInterface $output ) {
		$this->input  = $input;
		$this->output = $output;
	}

}
