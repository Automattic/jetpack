<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase
/**
 * User interface for the changelogger tool.
 *
 * @package automattic/jetpack-changelogger
 */

namespace Automattic\Jetpack\Changelogger;

use Symfony\Component\Console\Application as SymfonyApplication;
use Symfony\Component\Console\Formatter\OutputFormatterStyle;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * User interface for the changelogger tool.
 */
class Application extends SymfonyApplication {

	const VERSION = '1.1.2';

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct( 'Jetpack Changelogger', self::VERSION );
		$this->setCommandLoader( new CommandLoader() );
	}

	/**
	 * Called when the application is run.
	 *
	 * @param InputInterface  $input InputInterface.
	 * @param OutputInterface $output OutputInterface.
	 * @return int
	 */
	public function doRun( InputInterface $input, OutputInterface $output ) {
		Config::setOutput( $output );
		$output->getFormatter()->setStyle( 'warning', new OutputFormatterStyle( 'black', 'yellow' ) );
		return parent::doRun( $input, $output );
	}

}
