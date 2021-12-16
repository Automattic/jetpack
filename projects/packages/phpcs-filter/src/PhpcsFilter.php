<?php
/**
 * A filter for PHP CodeSniffer to add support for .phpcsignore files and per-directory configuration files.
 *
 * @package automattic/jetpack-phpcs-filter
 */

namespace Automattic\Jetpack;

use Automattic\IgnoreFile;
use PHP_CodeSniffer\Config;
use PHP_CodeSniffer\Exceptions\DeepExitException;
use PHP_CodeSniffer\Exceptions\RuntimeException;
use PHP_CodeSniffer\Files\LocalFile;
use PHP_CodeSniffer\Filters\Filter;
use PHP_CodeSniffer\Ruleset;
use PHP_CodeSniffer\Util;

/**
 * A filter for PHP CodeSniffer to add support for .phpcsignore files and per-directory configuration files.
 */
class PhpcsFilter extends Filter {

	/**
	 * Enable generation of LocalFile objects instead of string|SplFileInfo.
	 *
	 * @var boolean
	 */
	protected $produceLocalFileObjects = true;

	/**
	 * Base directory for the scan.
	 *
	 * @var string
	 */
	protected $filterBaseDir;

	/**
	 * Per-directory config file name.
	 *
	 * @var string
	 */
	protected $perDirFileName = '.phpcs.dir.xml';

	/**
	 * Process ignore files.
	 *
	 * @var boolean
	 */
	protected $doIgnore = true;

	/**
	 * Process .gitignore files.
	 *
	 * @var boolean
	 */
	protected $useGitignore = true;

	/**
	 * IgnoreFile instance for processing .phpcsignore.
	 *
	 * @var IgnoreFile
	 */
	protected $ignoreFile;

	/**
	 * Whether a .phpcsignore was checked for for a path.
	 *
	 * @var bool[]
	 */
	protected $ignoreLoaded = array();

	/**
	 * Cache of Config and Ruleset objects by directory.
	 *
	 * @var array
	 */
	protected $configCache = array();

	/**
	 * Constructs a filter.
	 *
	 * @param \RecursiveIterator       $iterator The iterator we are using to get file paths.
	 * @param string                   $basedir The top-level path we are filtering.
	 * @param \PHP_CodeSniffer\Config  $config The config data for the run.
	 * @param \PHP_CodeSniffer\Ruleset $ruleset The ruleset used for the run.
	 * @param PhpcsFilter|null         $copyFrom Used from getChildren().
	 * @throws DeepExitException On error.
	 */
	public function __construct( $iterator, $basedir, Config $config, Ruleset $ruleset, PhpcsFilter $copyFrom = null ) {
		parent::__construct( $iterator, $basedir, $config, $ruleset );

		if ( $copyFrom ) {
			if ( $this->ruleset === $copyFrom->ruleset ) {
				// Only copy these if the ruleset is the same. If it changed, these need to be regenerated.
				$this->ignoreDirPatterns  = $copyFrom->ignoreDirPatterns;
				$this->ignoreFilePatterns = $copyFrom->ignoreFilePatterns;
			}
			$this->acceptedPaths  = $copyFrom->acceptedPaths;
			$this->filterBaseDir  = $copyFrom->filterBaseDir;
			$this->perDirFileName = $copyFrom->perDirFileName;
			$this->doIgnore       = $copyFrom->doIgnore;
			$this->useGitignore   = $copyFrom->useGitignore;
			$this->ignoreFile     = $copyFrom->ignoreFile;
			$this->ignoreLoaded   = &$copyFrom->ignoreLoaded;
			$this->configCache    = &$copyFrom->configCache;
			return;
		}

		$noIgnore = $config->getConfigData( 'jetpack-filter-no-ignore' );
		if ( null !== $noIgnore ) {
			$this->doIgnore = ! $noIgnore;
		}

		$useGitignore = $config->getConfigData( 'jetpack-filter-use-gitignore' );
		if ( null !== $useGitignore ) {
			$this->useGitignore = (bool) $useGitignore;
		}

		$perDirFileName = $config->getConfigData( 'jetpack-filter-perdir-file' );
		if ( null !== $perDirFileName ) {
			$this->perDirFileName = $perDirFileName;
		}

		$dir = $config->getConfigData( 'jetpack-filter-basedir' );
		if ( null === $dir ) {
			$dir = $config->basepath;
		}
		if ( null === $dir ) {
			$dir = '.';
		}

		$realDir = Util\Common::realpath( $dir );
		// @codeCoverageIgnoreStart
		if ( false === $realDir ) {
			throw new DeepExitException( 'ERROR: ' . static::class . ": Specified base dir $dir does not exist.", 3 );
		}
		if ( ! is_dir( $realDir ) ) {
			throw new DeepExitException( 'ERROR: ' . static::class . ": Specified base dir $dir is not a directory.", 3 );
		}
		// @codeCoverageIgnoreEnd
		$this->filterBaseDir = $realDir;

		// @codeCoverageIgnoreStart
		if ( PHP_CODESNIFFER_VERBOSITY > 0 ) {
			echo "\n" . static::class . ": Using base directory $this->filterBaseDir\n";
		}
		// @codeCoverageIgnoreEnd

		$this->ignoreFile = new IgnoreFile();

		$this->configCache[ $this->filterBaseDir ] = array( $config, $ruleset );
	}

	/**
	 * Test if we've reached the base directory.
	 *
	 * @param string $dir Dir to match.
	 * @return bool
	 */
	protected function reachedBaseDir( $dir ) {
		$realDir = Util\Common::realpath( $dir );
		return ( $realDir === $this->filterBaseDir || substr( "$this->filterBaseDir/", 0, strlen( $realDir ) + 1 ) === "$realDir/" );
	}

	/**
	 * Load the .phpcsignore file for a path.
	 *
	 * @param string $path Path.
	 */
	protected function loadIgnoreFiles( $path ) {
		if ( ! $this->doIgnore ) {
			return;
		}

		$dir = is_dir( $path ) ? (string) $path : dirname( $path );

		// Already cached?
		if ( ! empty( $this->ignoreLoaded[ $dir ] ) ) {
			return;
		}

		// Have we passed the base dir? But still process if this *is* the base dir.
		if ( $this->reachedBaseDir( $dir ) && Util\Common::realpath( $dir ) !== $this->filterBaseDir ) {
			return;
		}

		// Mark as loaded, since we're doing so now.
		$this->ignoreLoaded[ $dir ] = true;

		// Load any parent .phpcsignore.
		$parent = dirname( $dir );
		if ( $parent !== $dir ) {
			$this->loadIgnoreFiles( $parent );
		}

		// Read any .gitignore and .phpcsignore in the current dir now.
		if ( $this->useGitignore && file_exists( "$dir/.gitignore" ) ) {
			// @codeCoverageIgnoreStart
			if ( PHP_CODESNIFFER_VERBOSITY > 0 ) {
				echo static::class . ": Loading $dir/.gitignore\n";
			}
			// @codeCoverageIgnoreEnd
			$data = file_get_contents( "$dir/.gitignore" );
			if ( false === $data ) {
				fprintf( STDERR, "WARN: Failed to read gitignore file %s\n", "$dir/.gitignore" ); // @codeCoverageIgnore
			} else {
				$this->ignoreFile->add( $data, "$dir/" );
			}
		}
		if ( file_exists( "$dir/.phpcsignore" ) ) {
			// @codeCoverageIgnoreStart
			if ( PHP_CODESNIFFER_VERBOSITY > 0 ) {
				echo static::class . ": Loading $dir/.phpcsignore\n";
			}
			// @codeCoverageIgnoreEnd
			$data = file_get_contents( "$dir/.phpcsignore" );
			if ( false === $data ) {
				fprintf( STDERR, "WARN: Failed to read phpcsignore file %s\n", "$dir/.phpcsignore" ); // @codeCoverageIgnore
			} else {
				$this->ignoreFile->add( $data, "$dir/" );
			}
		}
	}

	/**
	 * Fetch the Config and Ruleset for a path.
	 *
	 * @param string $path Path.
	 * @return array [ Config, Ruleset ]
	 * @throws DeepExitException On error.
	 */
	public function getConfigAndRuleset( $path ) {
		$dir = is_dir( $path ) ? (string) $path : dirname( $path );
		if ( $this->reachedBaseDir( $dir ) ) {
			$dir = $this->filterBaseDir;
		}

		// Already cached?
		if ( isset( $this->configCache[ $dir ] ) ) {
			return $this->configCache[ $dir ];
		}

		// Nope. Fetch parent, then possibly modify.
		$parent                   = dirname( $dir );
		list( $config, $ruleset ) = $this->getConfigAndRuleset( $parent === $dir ? $this->filterBaseDir : $parent );

		// Per directory config file found? Create a new Config and Ruleset for it.
		if ( file_exists( "$dir/$this->perDirFileName" ) ) {
			// @codeCoverageIgnoreStart
			if ( PHP_CODESNIFFER_VERBOSITY > 0 ) {
				echo static::class . ": Loading $dir/$this->perDirFileName\n";
			}
			// @codeCoverageIgnoreEnd
			$config            = clone $config;
			$config->standards = array_merge( $config->standards, array( "$dir/$this->perDirFileName" ) );
			try {
				$ruleset = new Ruleset( $config );
				// @codeCoverageIgnoreStart
			} catch ( RuntimeException $e ) {
				$error  = 'ERROR: ' . $e->getMessage() . PHP_EOL . PHP_EOL;
				$error .= $this->config->printShortUsage( true );
				throw new DeepExitException( $error, 3 );
			}
			// @codeCoverageIgnoreEnd
		}

		$this->configCache[ $dir ] = array( $config, $ruleset );
		return $this->configCache[ $dir ];
	}

	/**
	 * Check if a path should be processed.
	 *
	 * @param string|SplFileInfo $path The path to the file or directory being checked.
	 * @return bool
	 */
	protected function shouldProcessFile( $path ) {
		$old = array( $this->config, $this->ruleset );
		try {
			list( $this->config, $this->ruleset ) = $this->getConfigAndRuleset( $path );
			$ret                                  = parent::shouldProcessFile( $path );
		} finally {
			list( $this->config, $this->ruleset ) = $old;
		}
		return $ret;
	}

	/**
	 * Check if a path should be ignored.
	 *
	 * @param string|SplFileInfo $path The path to the file or directory being checked.
	 * @return bool
	 */
	protected function shouldIgnorePath( $path ) {
		$this->loadIgnoreFiles( $path );
		if ( $this->ignoreFile->ignores( is_dir( $path ) ? "$path/" : $path ) ) {
			return true;
		}

		$old = array( $this->config, $this->ruleset );
		try {
			list( $this->config, $this->ruleset ) = $this->getConfigAndRuleset( $path );
			$ret                                  = parent::shouldIgnorePath( $path );
		} finally {
			list( $this->config, $this->ruleset ) = $old;
		}
		return $ret;
	}

	/**
	 * Map the input string or SplFileInfo into a LocalFile.
	 *
	 * @return LocalFile
	 */
	public function current() {
		$filePath = (string) $this->getInnerIterator()->current();
		if ( is_dir( $filePath ) ) {
			return $filePath;
		}
		list( $config, $ruleset ) = $this->getConfigAndRuleset( $filePath );
		return new LocalFile( $filePath, $ruleset, $config );
	}

	/**
	 * Returns an iterator for the current entry.
	 *
	 * @return \RecursiveIterator
	 */
	public function getChildren() {
		$filePath                 = $this->getInnerIterator()->current();
		list( $config, $ruleset ) = $this->getConfigAndRuleset( (string) $filePath );
		return new static(
			new \RecursiveDirectoryIterator( $filePath, \RecursiveDirectoryIterator::SKIP_DOTS | \FilesystemIterator::FOLLOW_SYMLINKS ),
			$this->basedir,
			$config,
			$ruleset,
			$this
		);
	}

}
