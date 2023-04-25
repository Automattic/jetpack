<?php
/**
 * Command loader for the changelogger tool CLI.
 *
 * @package automattic/jetpack-changelogger
 */

namespace Automattic\Jetpack\Changelogger\php7;

use Automattic\Jetpack\Changelogger\CommandLoaderBase;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\CommandLoader\CommandLoaderInterface;

/**
 * Command loader for the changelogger tool CLI.
 */
class CommandLoader extends CommandLoaderBase implements CommandLoaderInterface {

	/**
	 * Checks if a command exists.
	 *
	 * @param string $name Command name.
	 * @return bool
	 */
	public function has( $name ): bool {
		return $this->doHas( $name );
	}

	/**
	 * Loads a command.
	 *
	 * @param string $name Command name.
	 * @return Command
	 * @throws CommandNotFoundException If the command is not found.
	 */
	public function get( $name ): Command {
		return $this->doGet( $name );
	}

	/**
	 * Return all command names.
	 *
	 * @return string[] All registered command names
	 */
	public function getNames(): array {
		return $this->doGetNames();
	}
}
