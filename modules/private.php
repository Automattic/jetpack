<?php
/**
 * Module Name: Private site
 * Module Description: Make your site only visible to you and users you approve.
 * Sort Order: 9
 * First Introduced: 7.4
 * Requires Connection: No
 * Auto Activate: No
 * Module Tags: Private
 * Feature: Security
 * Additional Search Queries: private, sandbox, launch, unlaunched, maintenance, coming soon
 *
 * @package Jetpack
 */

/* Private Site Class */
require_once 'private/class-jetpack-private.php';

Jetpack_Private::init();
