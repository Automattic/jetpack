<?php
/**
 * Module Name: Account protection
 * Module Description: When enabled, users can only set passwords that meet strong security standards, helping protect their accounts and your site.
 * Sort Order: 4
 * First Introduced: $$next-version$$
 * Requires Connection: Yes
 * Requires User Connection: No
 * Auto Activate: Yes
 * Module Tags: Account Protection
 * Feature: Security
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Account_Protection\Account_Protection;

( new Account_Protection() )->init();
