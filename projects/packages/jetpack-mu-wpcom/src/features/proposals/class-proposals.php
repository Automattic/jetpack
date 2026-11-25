<?php
/**
 * Proposals: staged changes an agent proposes and a person approves in chat.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Proposals;

use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use WP_Error;

/**
 * The public API. Nothing on the live site changes until apply() runs for the version the person approved.
 */
class Proposals {

	const POST_TYPE = Proposal_Store::POST_TYPE;

	/** Feature flag that turns the feature on. */
	const FLAG = 'proposals';

	/** Preview token query var. */
	const QUERY_VAR = 'jetpack_proposal';

	/** Most pending proposals checked when marking overlapping ones stale. */
	const STALE_SCAN_LIMIT = 100;

	/** Most proposals query() returns. */
	const QUERY_LIMIT = 20;

	/** Most proposals query() reads to find them. */
	const QUERY_SCAN_LIMIT = 200;

	/**
	 * Whether the feature is on for this site.
	 */
	public static function is_enabled(): bool {
		return Feature_Flags::is_enabled( self::FLAG );
	}

	/**
	 * Whether a user may use proposals. Capability checks still apply on top.
	 *
	 * @param int $user_id User ID, or 0 for the current user.
	 */
	public static function user_has_access( int $user_id = 0 ): bool {
		$user_id = $user_id ? $user_id : get_current_user_id();
		if ( $user_id < 1 || ! self::is_enabled() ) {
			return false;
		}

		/**
		 * Filters whether a user may use proposals.
		 *
		 * @since $$next-version$$
		 *
		 * @param bool $has_access Whether the user has access.
		 * @param int  $user_id    The user ID.
		 */
		return (bool) apply_filters( 'jetpack_proposals_user_has_access', true, $user_id );
	}

	/**
	 * Handlers by item type.
	 *
	 * @return array<string, Proposal_Handler>
	 */
	public static function handlers(): array {
		/**
		 * Filters the proposal handlers, keyed by item type.
		 *
		 * @since $$next-version$$
		 *
		 * @param array<string, Proposal_Handler> $handlers Handlers.
		 */
		return apply_filters(
			'jetpack_proposals_handlers',
			array( Post_Fields_Handler::TYPE => new Post_Fields_Handler() )
		);
	}

	/**
	 * Get a proposal by ID.
	 *
	 * @param int $proposal_id Proposal ID.
	 */
	public static function get( int $proposal_id ): ?array {
		return self::is_enabled() ? Proposal_Store::get( $proposal_id ) : null;
	}

	/**
	 * Proposals the current user can manage or review, newest first.
	 *
	 * Reads the newest QUERY_SCAN_LIMIT with these statuses, so older ones are not found.
	 *
	 * @param string[]    $statuses Statuses to include; unknown ones are ignored.
	 * @param string|null $target   Only proposals with an item for this target key, such as 'post:12'.
	 * @return array[]|WP_Error At most QUERY_LIMIT summaries, as to_summary() builds them.
	 */
	public static function query( array $statuses, ?string $target = null ) {
		$unavailable = self::check_available();
		if ( $unavailable ) {
			return $unavailable;
		}

		$statuses = array_intersect( $statuses, array_keys( Proposal_Store::STATUSES ) );
		if ( ! $statuses ) {
			return array();
		}

		$summaries = array();
		foreach ( Proposal_Store::posts_with_status( $statuses, self::QUERY_SCAN_LIMIT ) as $post ) {
			$proposal = Proposal_Store::from_post( $post );
			if ( null !== $target && ! in_array( $target, self::targets( $proposal ), true ) ) {
				continue;
			}
			if ( ! self::current_user_can_manage( $proposal ) && ! self::current_user_can_review( $proposal ) ) {
				continue;
			}
			$summaries[] = self::to_summary( $proposal );
			if ( count( $summaries ) >= self::QUERY_LIMIT ) {
				break;
			}
		}
		return $summaries;
	}

	/**
	 * A proposal in brief, for lists.
	 *
	 * @param array $proposal Proposal.
	 * @return array
	 */
	public static function to_summary( array $proposal ): array {
		return array(
			'proposal_id' => $proposal['id'],
			'title'       => $proposal['title'],
			'status'      => $proposal['status'],
			'created_gmt' => $proposal['created_gmt'],
			'author'      => $proposal['author'],
			'items'       => array_map(
				static fn( $item ) => array(
					'id'     => $item['id'],
					'type'   => $item['type'],
					'target' => $item['target'],
				),
				$proposal['items']
			),
		);
	}

	/**
	 * Get a proposal by its preview token.
	 *
	 * @param string $uuid A v4 UUID.
	 */
	public static function get_by_uuid( string $uuid ): ?array {
		return self::is_enabled() ? Proposal_Store::get_by_uuid( $uuid ) : null;
	}

	/**
	 * Create a proposal.
	 *
	 * @param string $title Label for the proposal.
	 * @param array  $items Requested changes. An entry with no type is a post_fields change.
	 * @return array{proposal: array, warnings: array}|WP_Error
	 */
	public static function create( string $title, array $items ) {
		$unavailable = self::check_available();
		if ( $unavailable ) {
			return $unavailable;
		}

		$built = self::build_items( $items );
		if ( is_wp_error( $built ) ) {
			return self::nothing_saved( $built );
		}

		$proposal_id = Proposal_Store::write(
			array(
				'post_type'    => Proposal_Store::POST_TYPE,
				'post_status'  => Proposal_Store::STATUSES['pending'],
				'post_title'   => self::sanitize_label( $title ),
				'post_name'    => wp_generate_uuid4(),
				'post_author'  => get_current_user_id(),
				'post_content' => Proposal_Store::encode( $built['items'] ),
			)
		);
		if ( is_wp_error( $proposal_id ) ) {
			return $proposal_id;
		}

		return array(
			// @phan-suppress-next-line PhanTypeMismatchReturn -- write() just stored it, so get() finds it.
			'proposal' => Proposal_Store::get( (int) $proposal_id ),
			'warnings' => $built['warnings'],
		);
	}

	/**
	 * Replace a proposal's title, changes, or both. The hash changes, so an earlier approval no longer applies.
	 *
	 * @param int         $proposal_id Proposal ID.
	 * @param string|null $title       New label, or null to keep it.
	 * @param array|null  $items       New requested changes, or null to keep them.
	 * @return array{proposal: array, warnings: array}|WP_Error
	 */
	public static function update( int $proposal_id, ?string $title, ?array $items ) {
		$unavailable = self::check_available();
		if ( $unavailable ) {
			return $unavailable;
		}

		return Proposal_Lock::with_lock(
			$proposal_id,
			static function () use ( $proposal_id, $title, $items ) {
				$proposal = Proposal_Store::get( $proposal_id );
				if ( ! $proposal || ! self::current_user_can_manage( $proposal ) ) {
					return self::not_found();
				}
				if ( ! in_array( $proposal['status'], array( 'pending', 'stale', 'rejected' ), true ) ) {
					return new WP_Error( 'proposal_closed', sprintf( 'Nothing was changed: this proposal was %s and can no longer change. Create a new proposal for further changes.', $proposal['status'] ) );
				}
				// Reopening with the rejected changes would let the rejected hash apply them.
				if ( 'rejected' === $proposal['status'] && null === $items ) {
					return self::rejected_unchanged();
				}
				// A new title alone would reopen it against content that no longer matches the live site.
				if ( 'stale' === $proposal['status'] && null === $items ) {
					return new WP_Error( 'proposal_stale', 'Nothing was changed: the live content changed since this proposal was made. Send its changes again so it is rebuilt against the current content.', array( 'status' => 409 ) );
				}

				$warnings = array();
				$postarr  = array(
					'ID'          => $proposal_id,
					'post_status' => Proposal_Store::STATUSES['pending'],
				);
				if ( null !== $title ) {
					$postarr['post_title'] = self::sanitize_label( $title );
				}
				if ( null !== $items ) {
					$built = self::build_items( $items );
					if ( is_wp_error( $built ) ) {
						return self::nothing_saved( $built );
					}
					$postarr['post_content'] = Proposal_Store::encode( $built['items'] );
					$warnings                = $built['warnings'];
					if ( 'rejected' === $proposal['status'] && Proposal_Store::hash( $postarr['post_content'] ) === $proposal['hash'] ) {
						return self::rejected_unchanged();
					}
				}

				$result = Proposal_Store::write( $postarr );
				if ( is_wp_error( $result ) ) {
					return $result;
				}
				// A revision clears the reviewer's note and any stopped apply's record.
				delete_post_meta( $proposal_id, Proposal_Store::REVIEW_META );

				return array(
					'proposal' => Proposal_Store::get( $proposal_id ),
					'warnings' => $warnings,
				);
			}
		);
	}

	/**
	 * Discard a proposal.
	 *
	 * @param int $proposal_id Proposal ID.
	 * @return array|WP_Error The discarded proposal.
	 */
	public static function discard( int $proposal_id ) {
		$unavailable = self::check_available();
		if ( $unavailable ) {
			return $unavailable;
		}

		return Proposal_Lock::with_lock(
			$proposal_id,
			static function () use ( $proposal_id ) {
				$proposal = Proposal_Store::get( $proposal_id );
				if ( ! $proposal || ! self::current_user_can_manage( $proposal ) ) {
					return self::not_found();
				}
				if ( 'discarded' === $proposal['status'] ) {
					return $proposal;
				}
				if ( 'applied' === $proposal['status'] ) {
					return new WP_Error( 'proposal_closed', 'Nothing was changed: this proposal was already applied, so it cannot be withdrawn. To undo it, edit the posts or restore an earlier revision.' );
				}

				$result = Proposal_Store::write(
					array(
						'ID'          => $proposal_id,
						'post_status' => Proposal_Store::STATUSES['discarded'],
					)
				);
				return is_wp_error( $result ) ? $result : Proposal_Store::get( $proposal_id );
			}
		);
	}

	/**
	 * Record the person's rejection of the version they were shown.
	 *
	 * @param int    $proposal_id Proposal ID.
	 * @param string $hash        Hash of the version the person rejected.
	 * @param string $note        The person's feedback.
	 * @param array  $context     Optional `client` and `agent` names, recorded with the rejection.
	 * @return true|WP_Error
	 */
	public static function reject( int $proposal_id, string $hash, string $note = '', array $context = array() ) {
		$unavailable = self::check_available();
		if ( $unavailable ) {
			return $unavailable;
		}

		return Proposal_Lock::with_lock(
			$proposal_id,
			static function () use ( $proposal_id, $hash, $note, $context ) {
				$proposal = Proposal_Store::get( $proposal_id );
				if ( ! $proposal ) {
					return self::not_found();
				}
				$check = self::check_reviewable( $proposal, $hash );
				if ( is_wp_error( $check ) ) {
					return $check;
				}

				$result = Proposal_Store::write(
					array(
						'ID'          => $proposal_id,
						'post_status' => Proposal_Store::STATUSES['rejected'],
					)
				);
				if ( is_wp_error( $result ) ) {
					return $result;
				}

				self::write_review( $proposal_id, self::review_record( 'rejected', $hash, $context ) + array( 'note' => sanitize_textarea_field( $note ) ) );
				return true;
			}
		);
	}

	/**
	 * Apply the version the person approved to the live site.
	 *
	 * @param int    $proposal_id Proposal ID.
	 * @param string $hash        Hash of the version the person approved.
	 * @param array  $context     Optional `client` and `agent` names, recorded with the apply.
	 * @return array{results: array<int, array>}|WP_Error
	 */
	public static function apply( int $proposal_id, string $hash, array $context = array() ) {
		$unavailable = self::check_available();
		if ( $unavailable ) {
			return $unavailable;
		}

		return Proposal_Lock::with_lock(
			$proposal_id,
			static function () use ( $proposal_id, $hash, $context ) {
				$proposal = Proposal_Store::get( $proposal_id );
				if ( ! $proposal ) {
					return self::not_found();
				}
				$check = self::check_reviewable( $proposal, $hash );
				if ( is_wp_error( $check ) ) {
					return $check;
				}

				// Conflicts are checked under the target locks, so a second apply sees the first one's writes.
				return Proposal_Lock::with_target_locks(
					self::targets( $proposal ),
					static fn() => self::apply_locked( $proposal, $hash, $context )
				);
			}
		);
	}

	/**
	 * The target keys of every item in a proposal.
	 *
	 * @param array $proposal Proposal.
	 * @return string[]
	 */
	private static function targets( array $proposal ): array {
		$handlers = self::handlers();
		$targets  = array();
		foreach ( $proposal['items'] as $item ) {
			$targets = array_merge( $targets, $handlers[ $item['type'] ]->targets( $item ) );
		}
		return $targets;
	}

	/**
	 * Check for conflicts, then write every item. Runs under the proposal's lock and its targets' locks.
	 *
	 * @param array  $proposal Proposal, already checked for status, access and hash.
	 * @param string $hash     Hash of the version the person approved.
	 * @param array  $context  Optional `client` and `agent` names.
	 * @return array{results: array<int, array>}|WP_Error
	 */
	private static function apply_locked( array $proposal, string $hash, array $context ) {
		$proposal_id = $proposal['id'];

		$conflicts = self::find_conflicts( $proposal );
		if ( $conflicts ) {
			$marked = Proposal_Store::write(
				array(
					'ID'          => $proposal_id,
					'post_status' => Proposal_Store::STATUSES['stale'],
				)
			);
			if ( is_wp_error( $marked ) ) {
				return $marked;
			}
			return new WP_Error(
				'proposal_stale',
				'Nothing was applied: the live content changed after this proposal was made, so it is now stale. Read the proposal to see what changed, revise it against the current content, then show the person the new version.',
				array( 'conflicts' => $conflicts )
			);
		}

		// Overwritten once every item is written, so a record left in this state means the apply stopped partway.
		self::write_review( $proposal_id, self::review_record( 'applying', $hash, $context ) );

		$handlers = self::handlers();
		$results  = array();
		// Described before writing: afterwards the live content no longer shows what changed.
		$descriptions = array();
		foreach ( $proposal['items'] as $item ) {
			$descriptions[ $item['id'] ] = $handlers[ $item['type'] ]->describe( $item, 'pending' );
		}
		foreach ( $proposal['items'] as $item ) {
			$results[] = array(
				'item' => $item['id'],
				'type' => $item['type'],
			) + $handlers[ $item['type'] ]->apply( $item );
		}

		$marked = Proposal_Store::write(
			array(
				'ID'          => $proposal_id,
				'post_status' => Proposal_Store::STATUSES['applied'],
			)
		);
		if ( is_wp_error( $marked ) ) {
			// The applying record stays, so the proposal reads as an apply that stopped partway.
			return new WP_Error( 'proposal_not_saved', 'The changes were written to the live site, but the proposal could not be marked as applied. Tell the person the changes are live, and do not apply it again.', array( 'results' => $results ) );
		}
		self::write_review(
			$proposal_id,
			self::review_record( 'applied', $hash, $context ) + array(
				'results'      => $results,
				'descriptions' => $descriptions,
			)
		);
		self::mark_overlapping_proposals_stale( $proposal );

		return array( 'results' => $results );
	}

	/**
	 * An apply that died before finishing leaves its "applying" record. While the lock is
	 * still held, the apply may be running.
	 *
	 * @param array $proposal Proposal.
	 * @return array{user_id: int, at: string}|null The stopped apply, if there is one.
	 */
	public static function stopped_apply( array $proposal ): ?array {
		$review = $proposal['review'];
		if ( 'applying' !== ( $review['action'] ?? '' ) || Proposal_Lock::is_held( $proposal['id'] ) ) {
			return null;
		}
		return array(
			'user_id' => (int) $review['user_id'],
			'at'      => (string) $review['at'],
		);
	}

	/**
	 * Whether the current user may preview, apply or reject every item.
	 *
	 * @param array $proposal Proposal.
	 */
	public static function current_user_can_review( array $proposal ): bool {
		if ( ! self::user_has_access() || ! $proposal['items'] ) {
			return false;
		}
		$handlers = self::handlers();
		foreach ( $proposal['items'] as $item ) {
			if ( ! $handlers[ $item['type'] ]->can_review( $item ) ) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Whether the current user may read, revise or discard the proposal.
	 *
	 * @param array $proposal Proposal.
	 */
	public static function current_user_can_manage( array $proposal ): bool {
		return self::user_has_access() && ( get_current_user_id() === $proposal['author'] || current_user_can( 'edit_others_posts' ) );
	}

	/**
	 * Live values that no longer match what the proposal was built against.
	 *
	 * @param array $proposal Proposal.
	 * @return array<int, array{item: string, reason: string}>
	 */
	public static function find_conflicts( array $proposal ): array {
		$handlers  = self::handlers();
		$conflicts = array();
		foreach ( $proposal['items'] as $item ) {
			foreach ( $handlers[ $item['type'] ]->conflicts( $item ) as $conflict ) {
				$conflicts[] = array( 'item' => $item['id'] ) + $conflict;
			}
		}
		return $conflicts;
	}

	/**
	 * The preview link the agent shares.
	 *
	 * @param array $proposal Proposal.
	 */
	public static function preview_url( array $proposal ): string {
		$handlers = self::handlers();
		$first    = $proposal['items'][0] ?? null;
		$base     = $first ? $handlers[ $first['type'] ]->preview_target( $first ) : null;
		return add_query_arg( self::QUERY_VAR, $proposal['uuid'], $base ? $base : home_url( '/' ) );
	}

	/**
	 * The shape agents see.
	 *
	 * @param array $proposal Proposal.
	 * @param array $warnings Warnings from create() or update().
	 * @return array
	 */
	public static function to_response( array $proposal, array $warnings = array() ): array {
		$handlers = self::handlers();
		$response = array(
			'proposal_id' => $proposal['id'],
			'title'       => $proposal['title'],
			'status'      => $proposal['status'],
			'created_gmt' => $proposal['created_gmt'],
			'hash'        => $proposal['hash'],
			'preview_url' => self::preview_url( $proposal ),
			'items'       => array(),
		);

		foreach ( $proposal['items'] as $item ) {
			$handler             = $handlers[ $item['type'] ];
			$target              = $handler->preview_target( $item );
			$response['items'][] = array(
				'id'          => $item['id'],
				'type'        => $item['type'],
				'target'      => $item['target'],
				'preview_url' => $target ? add_query_arg( self::QUERY_VAR, $proposal['uuid'], $target ) : self::preview_url( $proposal ),
				'description' => $proposal['review']['descriptions'][ $item['id'] ] ?? $handler->describe( $item, $proposal['status'] ),
			);
		}

		if ( in_array( $proposal['status'], array( 'pending', 'stale' ), true ) ) {
			$response['conflicts'] = self::find_conflicts( $proposal );
		}
		$review = $proposal['review'];
		if ( in_array( $review['action'] ?? '', array( 'applied', 'rejected' ), true ) ) {
			$response['reviewed_by'] = (int) $review['user_id'];
			$response['reviewed_at'] = (string) $review['at'];
			if ( isset( $review['client'] ) ) {
				$response['client'] = $review['client'];
			}
		}
		if ( 'rejected' === $proposal['status'] && isset( $review['note'] ) ) {
			$response['review_note'] = $review['note'];
		}
		if ( 'applied' === $proposal['status'] && isset( $review['results'] ) ) {
			$response['applied'] = $review['results'];
		}
		$stopped = self::stopped_apply( $proposal );
		if ( $stopped ) {
			$response['apply_stopped'] = sprintf( 'An apply started at %s stopped partway, so some changes may already be live. Ask the user to check them.', $stopped['at'] );
		}
		if ( $warnings ) {
			$response['warnings'] = $warnings;
		}

		return $response;
	}

	/**
	 * Add the proposal post type to Jetpack Sync's denylist. A stopgap until Sync lists it itself.
	 *
	 * @param mixed $value Stored setting, or the default when none is stored.
	 * @return mixed
	 */
	public static function exclude_from_sync( $value ) {
		if ( ! is_array( $value ) ) {
			$value = array();
		}
		if ( ! in_array( Proposal_Store::POST_TYPE, $value, true ) ) {
			$value[] = Proposal_Store::POST_TYPE;
		}
		return $value;
	}

	/**
	 * Why the current user cannot use proposals at all: the feature is off, or the access filter refuses them.
	 *
	 * @return WP_Error|null Null when they can.
	 */
	public static function check_available(): ?WP_Error {
		if ( ! self::is_enabled() ) {
			return new WP_Error( 'proposal_unavailable', 'Proposals are not available on this site.', array( 'status' => 403 ) );
		}
		if ( ! self::user_has_access() ) {
			return new WP_Error( 'proposal_forbidden', 'Proposals are not available for this account. Edit the content directly instead, or share the proposed changes in the conversation.', array( 'status' => 403 ) );
		}
		return null;
	}

	/**
	 * Validate and sanitize requested changes as the proposing user, with no side effects.
	 *
	 * @param array $requests Requested changes.
	 * @return array{items: array<int, array>, warnings: array<int, array>}|WP_Error
	 */
	private static function build_items( array $requests ) {
		if ( ! $requests ) {
			return new WP_Error( 'proposal_empty', 'Include at least one change.' );
		}
		if ( count( $requests ) > Proposal_Store::MAX_ITEMS ) {
			return new WP_Error( 'proposal_too_large', sprintf( 'A proposal can make at most %d changes.', Proposal_Store::MAX_ITEMS ) );
		}
		$requests = array_values( $requests );
		$handlers = self::handlers();
		$items    = array();
		$warnings = array();
		$targets  = array();

		foreach ( $requests as $index => $request ) {
			$type    = is_array( $request ) ? ( $request['type'] ?? Post_Fields_Handler::TYPE ) : null;
			$handler = is_string( $type ) ? ( $handlers[ $type ] ?? null ) : null;
			if ( ! $handler ) {
				return new WP_Error( 'proposal_invalid_item', sprintf( 'Change %d has an unknown type. Known types: %s.', $index + 1, implode( ', ', array_keys( $handlers ) ) ) );
			}

			// The engine owns type, so handlers only see their own fields.
			unset( $request['type'] );
			$built = $handler->build( $request );
			if ( is_wp_error( $built ) ) {
				return $built;
			}

			$item = array(
				'id'     => 'i' . ( $index + 1 ),
				'type'   => $type,
				'target' => $built['target'],
				'base'   => $built['base'],
				'change' => $built['change'],
			);

			foreach ( $handler->targets( $item ) as $target ) {
				if ( isset( $targets[ $target ] ) ) {
					return new WP_Error( 'proposal_duplicate_item', sprintf( 'More than one change targets %s. Combine them into one.', $target ) );
				}
				$targets[ $target ] = true;
			}
			if ( ! empty( $built['warning'] ) ) {
				$warnings[] = array(
					'item'    => $item['id'],
					'target'  => $item['target'],
					'content' => $built['warning'],
				);
			}
			$items[] = $item;
		}

		return array(
			'items'    => $items,
			'warnings' => $warnings,
		);
	}

	/**
	 * Whether the proposal can be applied or rejected now, as this version, by this user.
	 *
	 * @param array  $proposal Proposal.
	 * @param string $hash     Hash of the version the person was shown.
	 * @return true|WP_Error
	 */
	private static function check_reviewable( array $proposal, string $hash ) {
		// First, so the other errors reveal nothing to someone who cannot review it. A damaged proposal has no items to check.
		$can_review = self::current_user_can_review( $proposal );
		if ( ! $can_review && ! self::current_user_can_manage( $proposal ) ) {
			return self::not_found();
		}
		if ( $proposal['items'] && ! $can_review ) {
			return new WP_Error( 'proposal_forbidden', 'Nothing was changed: you cannot make every change in this proposal, because you cannot edit one of its posts or a post no longer exists. Someone who can edit all of its posts has to apply or reject it; if a post was deleted, withdraw the proposal instead.' );
		}
		if ( 'pending' !== $proposal['status'] ) {
			return new WP_Error( 'proposal_closed', self::closed_message( $proposal['status'] ) );
		}
		if ( ! $proposal['items'] ) {
			return new WP_Error( 'proposal_invalid', 'Nothing was changed: this proposal\'s stored data is damaged, so it cannot be applied. Discard it and create a new one.' );
		}
		if ( ! hash_equals( $proposal['hash'], $hash ) ) {
			return new WP_Error( 'proposal_changed', 'Nothing was changed: this proposal was revised after the hash you sent was read. Read it again for the current hash, show the person that version and ask again.' );
		}
		return true;
	}

	/**
	 * A rejected proposal reopens only with changes that differ from the rejected version.
	 */
	private static function rejected_unchanged(): WP_Error {
		return new WP_Error( 'proposal_no_changes', 'Nothing was changed: these are the changes the person rejected. Send revised changes to reopen the proposal.', array( 'status' => 400 ) );
	}

	/**
	 * Why a closed proposal cannot be applied or rejected, and what to do instead.
	 *
	 * @param string $status Proposal status.
	 */
	private static function closed_message( string $status ): string {
		switch ( $status ) {
			case 'applied':
				return 'Nothing was changed: this proposal was already applied. Read it to see the outcome of each change.';
			case 'discarded':
				return 'Nothing was changed: this proposal was withdrawn. Create a new proposal if the changes are still wanted.';
			default:
				return sprintf( 'Nothing was changed: this proposal is %s. Revise it against the current content, then show the person the new version.', $status );
		}
	}

	/**
	 * Who acted, when, and through which client.
	 *
	 * @param string $action  applying, applied or rejected.
	 * @param string $hash    Hash of the version acted on.
	 * @param array  $context Optional `client` and `agent` names.
	 * @return array
	 */
	private static function review_record( string $action, string $hash, array $context ): array {
		$record = array(
			'action'  => $action,
			'user_id' => get_current_user_id(),
			'at'      => gmdate( 'c' ),
			'hash'    => $hash,
		);
		foreach ( array( 'client', 'agent' ) as $key ) {
			if ( isset( $context[ $key ] ) && is_string( $context[ $key ] ) && '' !== $context[ $key ] ) {
				$record[ $key ] = mb_substr( sanitize_text_field( $context[ $key ] ), 0, 100 );
			}
		}
		return $record;
	}

	/**
	 * Save a review record. Meta writes unslash, so it is slashed first to keep the notes and descriptions as written.
	 *
	 * @param int   $proposal_id Proposal ID.
	 * @param array $record      Review record.
	 */
	private static function write_review( int $proposal_id, array $record ): void {
		update_post_meta( $proposal_id, Proposal_Store::REVIEW_META, wp_slash( $record ) );
	}

	/**
	 * Other open proposals for what was just changed can no longer apply, so mark them stale now.
	 *
	 * @param array $applied The proposal just applied.
	 */
	private static function mark_overlapping_proposals_stale( array $applied ): void {
		$targets = self::targets( $applied );

		foreach ( Proposal_Store::posts_with_status( array( 'pending' ), self::STALE_SCAN_LIMIT ) as $post ) {
			if ( (int) $post->ID === $applied['id'] ) {
				continue;
			}
			if ( ! array_intersect( $targets, self::targets( Proposal_Store::from_post( $post ) ) ) ) {
				continue;
			}

			// A proposal being applied now would be judged against its own changes.
			if ( ! Proposal_Lock::acquire( (int) $post->ID ) ) {
				continue;
			}
			try {
				$other = Proposal_Store::get( (int) $post->ID );
				if ( $other && 'pending' === $other['status'] && self::find_conflicts( $other ) ) {
					Proposal_Store::write(
						array(
							'ID'          => $other['id'],
							'post_status' => Proposal_Store::STATUSES['stale'],
						)
					);
				}
			} finally {
				Proposal_Lock::release( (int) $post->ID );
			}
		}
	}

	/**
	 * A proposal label.
	 *
	 * @param string $title Requested label.
	 */
	private static function sanitize_label( string $title ): string {
		$title = sanitize_text_field( $title );
		return '' === $title ? 'Untitled proposal' : $title;
	}

	/**
	 * Say that nothing was saved, since MCP clients see only the message.
	 *
	 * @param WP_Error $error A validation error.
	 */
	private static function nothing_saved( WP_Error $error ): WP_Error {
		$message = $error->get_error_message();
		if ( 0 === strpos( $message, 'Nothing was' ) ) {
			return $error;
		}
		return new WP_Error( $error->get_error_code(), 'Nothing was saved: ' . lcfirst( $message ), $error->get_error_data() );
	}

	/**
	 * Not found, or not visible to this user.
	 */
	public static function not_found(): WP_Error {
		return new WP_Error( 'proposal_not_found', 'Nothing was changed: no proposal with this ID exists on this site, or you cannot see it.', array( 'status' => 404 ) );
	}
}
