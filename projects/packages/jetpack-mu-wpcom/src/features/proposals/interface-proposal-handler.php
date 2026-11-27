<?php
/**
 * The interface each type of proposed change implements.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Proposals;

use WP_Error;

/**
 * One handler per type of data. The engine stores and locks items; handlers own their data.
 *
 * A stored item is { id, type, target, base, change }. Handlers fill target, base and change.
 */
interface Proposal_Handler {

	/**
	 * Validate and sanitize a requested change as the proposing user, with no side effects.
	 *
	 * @param array $request The agent's request for this item.
	 * @return array|WP_Error { target, base, change, warning? }
	 */
	public function build( array $request );

	/**
	 * Whether a stored item has a shape build() could have produced.
	 *
	 * @param array $item Stored item.
	 */
	public function is_valid( array $item ): bool;

	/**
	 * What the item changes, such as 'post:12'. No two items in a proposal may share one.
	 *
	 * @param array $item Stored item.
	 * @return string[]
	 */
	public function targets( array $item ): array;

	/**
	 * Whether the current user may preview, apply or reject the item.
	 *
	 * @param array $item Stored item.
	 */
	public function can_review( array $item ): bool;

	/**
	 * Live values that changed since the item was built.
	 *
	 * @param array $item Stored item.
	 * @return array<int, array{reason: string}>
	 */
	public function conflicts( array $item ): array;

	/**
	 * Add the overlay and write guard for these items. Called once per preview request.
	 *
	 * @param array $items Stored items of this type.
	 */
	public function start_preview( array $items ): void;

	/**
	 * The live URL that best shows the item.
	 *
	 * @param array $item Stored item.
	 */
	public function preview_target( array $item ): ?string;

	/**
	 * Write the change as the current user. Reports failure in the result rather than returning an error.
	 *
	 * @param array $item Stored item.
	 * @return array{changed: string[], error?: string}
	 */
	public function apply( array $item ): array;

	/**
	 * The change, for an agent to show the person in chat.
	 *
	 * @param array  $item   Stored item.
	 * @param string $status Proposal status. Live values are only a baseline while it is pending.
	 * @return array<int, array{label: string, kind: string}>
	 */
	public function describe( array $item, string $status ): array;
}
