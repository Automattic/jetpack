<?php
/**
 * Stub for constants, since Phan doesn't recognize the `$this->define()` calls in ZeroBSCRM.Core.php as defining them.
 *
 * Note the actual values shouldn't matter here, but getting the types right is
 * probably a good idea. Avoid `true` and `false`, as those are distinct from
 * "bool".
 *
 * @package automattic/jetpack-crm
 */

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable -- Don't care, this is stubs.

define( 'ZBS_ABSPATH', './' );
define( 'ZEROBSCRM_PATH', './' );
define( 'ZEROBSCRM_URL', 'http://localhost/wp-content/plugins/zero-bs-crm/' );
define( 'ZEROBSCRM_TEMPLATEPATH', ZEROBSCRM_PATH . 'templates/' );
define( 'ZEROBSCRM_TEMPLATEURL', ZEROBSCRM_URL . 'templates/' );
define( 'ZEROBSCRM_INCLUDE_PATH', ZEROBSCRM_PATH . 'includes/' );
define( 'JPCRM_MODULES_PATH', ZEROBSCRM_PATH . 'modules/' );
define( 'ZBSCRMCORELOADED', true ); // Always defined as true when defined.
define( 'ZBS_MENU_FULL', 1 );
define( 'ZBS_MENU_SLIM', 2 );
define( 'ZBS_MENU_CRMONLY', 3 );
define( 'ZBS_CRM_DEBUG', (bool) $v );
