<?php
/**
 * Command loader for the changelogger tool CLI.
 *
 * @package automattic/jetpack-changelogger
 */

namespace Automattic\Jetpack\Changelogger;

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\CommandLoader\CommandLoaderInterface;
use Symfony\Component\Console\Exception\CommandNotFoundException;

/**
 * Command loader for the changelogger tool CLI.
 */
class CommandLoader implements CommandLoaderInterface {
	/**
	 * Get the class name for a command.
	 *
	 * @param string $name Command name.
	 * @return string Class name.
	 */
	private function get_class_name( $name ) {
		return __NAMESPACE__ . '\\' . ucfirst( $name ) . 'Command';
	}

	/**
	 * Checks if a command exists.
	 *
	 * @param string $name Command name.
	 * @return bool
	 */
	protected function doHas( $name ) {
		return class_exists( $this->get_class_name( $name ) );
	}

	/**
	 * Loads a command.
	 *
	 * @param string $name Command name.
	 * @return Command
	 * @throws CommandNotFoundException If the command is not found.
	 */
	protected function doGet( $name ) {
		$class = $this->get_class_name( $name );
		if ( ! class_exists( $class ) ) {
			throw new CommandNotFoundException( "Command \"$name\" does not exist." );
		}
		return new $class();
	}

	/**
	 * Return all command names.
	 *
	 * @return string[] All registered command names
	 */
	protected function doGetNames() {
		$names = array();
		foreach ( new \DirectoryIterator( __DIR__ ) as $file ) {
			if ( substr( $file->getBasename(), -11 ) === 'Command.php' ) {
				$names[] = lcfirst( substr( $file->getBasename(), 0, -11 ) );
			}
		}
		sort( $names );
		return $names;
	}

	/**
	 * Checks if a command exists.
	 *
	 * @param string $name Command name.
	 * @phan-suppress-previous-line PhanParamSignatureRealMismatchHasNoParamType -- Parameter type widening is allowed since php 7.2, and this only widens since symfony/console 5.0 which requires 7.2.5. Adding `string` would break compatibility with earlier symfony/console versions needed to support 7.0 and 7.1.
	 * @return bool
	 */
	public function has( $name ): bool {
		return $this->doHas( $name );
	}

	/**
	 * Loads a command.
	 *
	 * @param string $name Command name.
	 * @phan-suppress-previous-line PhanParamSignatureRealMismatchHasNoParamType -- Parameter type widening is allowed since php 7.2, and this only widens since symfony/console 5.0 which requires 7.2.5. Adding `string` would break compatibility with earlier symfony/console versions needed to support 7.0 and 7.1.
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
