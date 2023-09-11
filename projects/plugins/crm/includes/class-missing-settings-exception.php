<?php
/**
 * Jetpack CRM Missing Settings Exception Class
 * Extends Exception to provide additional data.
 *
 */

namespace Automattic\JetpackCRM;

defined( 'ZEROBSCRM_PATH' ) || exit;

/**
 * Missing Settings exception class.
 */
class Missing_Settings_Exception extends CRM_Exception {}