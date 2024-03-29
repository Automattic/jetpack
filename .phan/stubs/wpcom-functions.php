<?php
/**
 * Phan stubs for WPCOM-defined functions.
 *
 * @package automattic/jetpack-monorepo
 */

/**
 * Whether to enable the nav redesign.
 *
 * @phan-return bool Returns true if the nav redesign is enabled, false otherwise.
 */
function wpcom_is_nav_redesign_enabled(): bool {}

/**
 * Whether the user is an Automattician
 *
 * @param int|null $user_id The user id.
 * @phan-return bool Returns true if the user is Automattician, false otherwise.
 */
function is_automattician( $user_id = null ): bool {} // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
