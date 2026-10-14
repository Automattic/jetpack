import { store as blocksStore } from '@wordpress/blocks';
import { store as coreStore, useEntityRecords } from '@wordpress/core-data';
import { useSelect, dispatch, resolveSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { isContentBlock } from './is-content-block';
import type { Scope, GuidelineRow, ContentBlock, GuidelineQuery, KnowledgeRow } from './types';

export const KNOWLEDGE_KIND = 'postType';
export const KNOWLEDGE_NAME = 'wp_knowledge';

const SCOPE_PREFIX = 'guideline-';
const BLOCK_PREFIX = 'guideline-block-';

// Blocks uses per-block rows instead of a single scope row; removing the registry entry hides the section.
export const BLOCKS_SCOPE = 'blocks';

// Sentinel slug used while the registry/block list is still empty so the
// collection query matches nothing instead of every knowledge row.
const NO_MATCH_SLUG = 'guideline-__none__';

/**
 * The slug for a registry scope row, e.g. `guideline-copy`.
 * @param scope - Scope key.
 * @return Slug of the scope row.
 */
export function scopeSlug( scope: string ): string {
	return `${ SCOPE_PREFIX }${ scope }`;
}

/**
 * The slug for a block guideline row, e.g. `guideline-block-core_paragraph`.
 *
 * @param blockName - Exact block name (e.g. `core/paragraph`).
 * @return Slug of the block row.
 */
export function blockSlug( blockName: string ): string {
	return `${ BLOCK_PREFIX }${ blockName.replace( '/', '_' ) }`;
}

/**
 * The content-role blocks from the client block registry — the authoritative
 * list of blocks that can carry guidelines.
 *
 * @return Registered content blocks.
 */
export function useContentBlocks(): ContentBlock[] {
	return useSelect(
		s =>
			s( blocksStore )
				.getBlockTypes()
				.filter( ( block: ContentBlock ) => isContentBlock( block.name ) ),
		[]
	);
}

interface GuidelineData {
	scopes: Scope[];
	contentBlocks: ContentBlock[];
	bySlug: Record< string, GuidelineRow >;
	query: GuidelineQuery;
	isLoading: boolean;
}

/**
 * Reads the guideline scope registry and the per-scope/per-block rows in one
 * slug-filtered collection request, indexed by slug.
 *
 * @return Scopes, rows, and loading state.
 */
export function useGuidelineData(): GuidelineData {
	const { records: scopeRecords, hasResolved: scopesResolved } = useEntityRecords(
		'root',
		'guidelineScope'
	);

	const contentBlocks = useContentBlocks();

	const scopes: Scope[] = useMemo(
		() =>
			( ( scopeRecords as Scope[] ) ?? [] )
				.map( s => ( {
					slug: s.slug,
					title: s.title,
					description: s.description,
					order: s.order ?? 0,
				} ) )
				.sort( ( a, b ) => a.order - b.order ),
		[ scopeRecords ]
	);

	const slugs = useMemo( () => {
		// Per-block rows only exist while the Blocks scope is registered. When a
		// plugin removes it, drop the block slugs so we stop querying those rows.
		const hasBlocksScope = scopes.some( s => s.slug === BLOCKS_SCOPE );
		const list = [
			// The Blocks scope has no single row; its per-block rows are added below.
			...scopes.filter( s => s.slug !== BLOCKS_SCOPE ).map( s => scopeSlug( s.slug ) ),
			...( hasBlocksScope ? contentBlocks.map( b => blockSlug( b.name ) ) : [] ),
		];
		return list.length > 0 ? list : [ NO_MATCH_SLUG ];
	}, [ scopes, contentBlocks ] );

	const query: GuidelineQuery = useMemo(
		() => ( {
			slug: slugs,
			// The published row is the canonical one. Private/draft/suffixed
			// rows with the same slug are placeholders the page ignores; a save
			// reclaims them (see saveGuidelineRow) rather than showing them.
			status: [ 'publish' ],
			// api-fetch's fetch-all middleware converts -1 into paginated 100-item REST requests.
			per_page: -1,
		} ),
		[ slugs ]
	);

	const { records: rowRecords, hasResolved: rowsResolved } = useEntityRecords< KnowledgeRow >(
		KNOWLEDGE_KIND,
		KNOWLEDGE_NAME,
		query
	);

	const bySlug = useMemo( () => {
		const map: Record< string, GuidelineRow > = {};
		for ( const row of rowRecords ?? [] ) {
			map[ row.slug ] = {
				id: row.id,
				content: row.content?.raw ?? '',
			};
		}
		return map;
	}, [ rowRecords ] );

	return {
		scopes,
		contentBlocks,
		bySlug,
		query,
		// Use hasResolved (not isResolving): isResolving is briefly false before
		// the rows query starts, which would let the page render with empty
		// content and clobber freshly-typed text once the rows arrive.
		isLoading: ! scopesResolved || ! rowsResolved,
	};
}

interface ReclaimableRow {
	id: number;
	author: number;
}

/**
 * Finds an existing row that already owns this exact slug so a save can reuse it instead of creating a
 * duplicate.
 *
 * @param slug - Row slug.
 * @return Existing row with the same slug, if any.
 */
async function findReclaimableRow( slug: string ): Promise< ReclaimableRow | undefined > {
	const rows = ( await resolveSelect( coreStore ).getEntityRecords(
		KNOWLEDGE_KIND,
		KNOWLEDGE_NAME,
		{
			slug,
			status: [ 'publish', 'private', 'draft', 'pending', 'future' ],
			per_page: 1,
		}
	) ) as ReclaimableRow[] | null;

	return rows?.[ 0 ];
}

/**
 * Creates, updates, or reclaims the guideline row for the given slug.
 *
 * @param slug       - Row slug.
 * @param title      - Title to send (registry title for scopes, exact block name for blocks).
 * @param content    - Guideline text.
 * @param existingId - Existing published row id, or undefined.
 * @param query      - The collection query to invalidate after a create/reclaim.
 */
export async function saveGuidelineRow(
	slug: string,
	title: string,
	content: string,
	existingId: number | undefined,
	query: GuidelineQuery
): Promise< void > {
	const { editEntityRecord, saveEditedEntityRecord, saveEntityRecord, invalidateResolution } =
		dispatch( coreStore );

	// The known published row and an existing same-slug row (e.g. a private
	// placeholder) are both in the store, so they share one update path; only a
	// brand-new scope is created.
	const reclaimable = existingId ? undefined : await findReclaimableRow( slug );
	const targetId = existingId ?? reclaimable?.id;

	if ( targetId ) {
		const edits: Record< string, unknown > = {
			title,
			content,
			status: 'publish',
		};
		// Reassign the author only when taking over another user's row
		// (admin-only, gated by `edit_others_knowledge_items` +
		// `publish_knowledge_items`). `saveEditedEntityRecord` sends only changed
		// fields, so re-stamping `title`/`status` on the published row is a no-op.
		if ( reclaimable ) {
			const currentUser = await resolveSelect( coreStore ).getCurrentUser();
			if ( currentUser?.id && reclaimable.author !== currentUser.id ) {
				edits.author = currentUser.id;
			}
		}

		await editEntityRecord( KNOWLEDGE_KIND, KNOWLEDGE_NAME, targetId, edits );
		await saveEditedEntityRecord( KNOWLEDGE_KIND, KNOWLEDGE_NAME, targetId, {
			throwOnError: true,
		} );
	} else {
		await saveEntityRecord(
			KNOWLEDGE_KIND,
			KNOWLEDGE_NAME,
			{ slug, title, content, status: 'publish' },
			{ throwOnError: true }
		);
	}

	// Refresh created or reclaimed rows before resolving so exports cannot race the collection fetch.
	if ( ! existingId ) {
		invalidateResolution( 'getEntityRecords', [ KNOWLEDGE_KIND, KNOWLEDGE_NAME, query ] );
		await resolveSelect( coreStore ).getEntityRecords( KNOWLEDGE_KIND, KNOWLEDGE_NAME, query );
	}
}

/**
 * Deletes a guideline row (force, so no empty rows linger and the slug frees up).
 * @param id - Row id.
 */
export async function deleteGuidelineRow( id: number ): Promise< void > {
	await dispatch( coreStore ).deleteEntityRecord(
		KNOWLEDGE_KIND,
		KNOWLEDGE_NAME,
		id,
		{ force: true },
		{ throwOnError: true }
	);
}
