<?php
/**
 * Set of REST API routes used in WPCOM Unified Importer.
 *
 * @package automattic/jetpack-import
 */

namespace Automattic\Jetpack;

/**
 * This class will provide endpoint for the Unified Importer.
 */
class Import {
	/**
	 * Package version.
	 *
	 * @var string
	 */
	const PACKAGE_VERSION = '0.1.0-alpha';

	/**
	 * REST API prefix.
	 *
	 * @var string
	 */
	const REST_PREFIX = 'import/';
}
