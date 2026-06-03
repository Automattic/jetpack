<?php
/**
 * Legacy base class for Jetpack's debugging tests.
 *
 * @deprecated Use Connection_Health_Test_Base or Connection_Health_Tests from the connection package directly.
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Connection_Health_Test_Base;

/**
 * "Unit Tests" for the Jetpack connection.
 *
 * @since 7.1.0
 * @deprecated Use Connection_Health_Test_Base or Connection_Health_Tests from the connection package directly.
 */
class Jetpack_Cxn_Test_Base extends Connection_Health_Test_Base {
}
