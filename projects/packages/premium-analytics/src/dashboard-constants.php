<?php
/**
 * Dashboard constants shared across Premium Analytics dashboard APIs.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * Dashboard identifier pattern used by REST routes and dashboard registries.
 *
 * Allows the `<plugin>_<page>` form produced by the wp-build pipeline, while
 * also accepting simple dashboard names for consumers that do not use a page
 * suffix.
 */
const DASHBOARD_NAME_PATTERN = '[a-z][a-z0-9-]*(?:_[a-z0-9-]+)*';

/**
 * Anchored dashboard identifier regex for validating registered dashboard names.
 */
const DASHBOARD_NAME_REGEX = '/^' . DASHBOARD_NAME_PATTERN . '$/';
