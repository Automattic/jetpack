/**
 * Pins the upstream behaviour that `useClearPhantomMetaDirt` works around, against the real
 * `@wordpress/core-data` store.
 *
 * On a collaboration-enabled site the editor rewrites `meta` in the save payload
 * (prePersistPostType injects a freshly serialized `_crdt_document`) after the meta edit was
 * staged. The staged meta then matches neither the response record nor the sent edits, so the
 * edits reducer keeps it and the post stays dirty forever.
 *
 * When the BUG case below starts failing, upstream has fixed it and the workaround can go.
 */
import { store as coreDataStore } from '@wordpress/core-data';
import { createRegistry } from '@wordpress/data';

const KEY = '_jetpack_dont_email_post_to_subs';
const CRDT = '_crdt_document';

const ENTITY = {
	kind: 'postType',
	name: 'post',
	baseURL: '/wp/v2/posts',
	baseURLParams: { context: 'edit' },
	mergedEdits: { meta: true },
	key: 'id',
};

const persistedRecord = crdtDoc => ( {
	id: 1,
	title: { raw: 'Hello', rendered: 'Hello' },
	content: { raw: 'Body', rendered: 'Body' },
	status: 'draft',
	meta: {
		[ KEY ]: false,
		_jetpack_newsletter_access: '',
		...( crdtDoc ? { [ CRDT ]: crdtDoc } : {} ),
	},
} );

async function setup( crdtDoc ) {
	const registry = createRegistry();
	registry.register( coreDataStore );
	const { dispatch, select } = registry;

	dispatch( coreDataStore ).addEntities( [ ENTITY ] );
	dispatch( coreDataStore ).receiveEntityRecords( 'postType', 'post', persistedRecord( crdtDoc ) );

	// What useSetAccess / the newsletter toggle do: stage the whole merged meta.
	await dispatch( coreDataStore ).editEntityRecord( 'postType', 'post', 1, {
		meta: { [ KEY ]: true },
	} );

	return { select, dispatch };
}

// Simulates what core-data's saveEntityRecord does after the REST round-trip:
// receiveEntityRecords( ..., updatedRecord, undefined, true, sentEdits ).
// `rewriteCrdt` mirrors prePersistPostType injecting a fresh snapshot into the payload.
function simulateSave( { select, dispatch }, rewriteCrdt ) {
	const stagedMeta = select( coreDataStore ).getEntityRecordEdits( 'postType', 'post', 1 ).meta;

	// prePersistPostType rewrites `meta` in the payload, after the edit was staged.
	const sentMeta = rewriteCrdt ? { ...stagedMeta, [ CRDT ]: 'blob-B-fresh' } : { ...stagedMeta };

	const updatedRecord = { ...persistedRecord(), meta: sentMeta };

	dispatch( coreDataStore ).receiveEntityRecords(
		'postType',
		'post',
		updatedRecord,
		undefined,
		true,
		{ meta: sentMeta }
	);
}

describe( 'NL-797 mechanism: does a staged meta edit survive a save?', () => {
	test( 'CONTROL — collaboration off: the edit clears and the post goes clean', async () => {
		const ctx = await setup( null );
		expect( ctx.select( coreDataStore ).hasEditsForEntityRecord( 'postType', 'post', 1 ) ).toBe(
			true
		);

		simulateSave( ctx, false );

		expect( ctx.select( coreDataStore ).hasEditsForEntityRecord( 'postType', 'post', 1 ) ).toBe(
			false
		);
	} );

	test( 'BUG — collaboration on: the edit survives the save, post stays dirty', async () => {
		const ctx = await setup( 'blob-A-stale' );
		expect( ctx.select( coreDataStore ).hasEditsForEntityRecord( 'postType', 'post', 1 ) ).toBe(
			true
		);

		simulateSave( ctx, true );

		const editsAfter = ctx.select( coreDataStore ).getEntityRecordEdits( 'postType', 'post', 1 );

		expect( ctx.select( coreDataStore ).hasEditsForEntityRecord( 'postType', 'post', 1 ) ).toBe(
			true
		);
		// And the value that keeps it dirty is the CRDT blob, not anything the user typed.
		expect( editsAfter.meta[ CRDT ] ).toBe( 'blob-A-stale' );
		expect( editsAfter.meta[ KEY ] ).toBe( true );
	} );

	test( 'FIX — realigning only the CRDT key clears the phantom dirt', async () => {
		const ctx = await setup( 'blob-A-stale' );
		simulateSave( ctx, true );
		expect( ctx.select( coreDataStore ).hasEditsForEntityRecord( 'postType', 'post', 1 ) ).toBe(
			true
		);

		// The proposed hook: realign the one stale key against the persisted record.
		const persistedDoc = ctx.select( coreDataStore ).getRawEntityRecord( 'postType', 'post', 1 )
			.meta[ CRDT ];

		await ctx
			.dispatch( coreDataStore )
			.editEntityRecord(
				'postType',
				'post',
				1,
				{ meta: { [ CRDT ]: persistedDoc } },
				{ undoIgnore: true }
			);

		expect( ctx.select( coreDataStore ).hasEditsForEntityRecord( 'postType', 'post', 1 ) ).toBe(
			false
		);
	} );

	test( 'FIX is safe — a genuinely unsaved meta change is NOT swallowed', async () => {
		const ctx = await setup( 'blob-A-stale' );
		simulateSave( ctx, true );

		// Another panel edits meta after the save completed.
		await ctx.dispatch( coreDataStore ).editEntityRecord( 'postType', 'post', 1, {
			meta: { _jetpack_newsletter_access: 'subscribers' },
		} );

		const persistedDoc = ctx.select( coreDataStore ).getRawEntityRecord( 'postType', 'post', 1 )
			.meta[ CRDT ];

		await ctx
			.dispatch( coreDataStore )
			.editEntityRecord(
				'postType',
				'post',
				1,
				{ meta: { [ CRDT ]: persistedDoc } },
				{ undoIgnore: true }
			);

		const editsAfter = ctx.select( coreDataStore ).getEntityRecordEdits( 'postType', 'post', 1 );

		expect( ctx.select( coreDataStore ).hasEditsForEntityRecord( 'postType', 'post', 1 ) ).toBe(
			true
		);
		expect( editsAfter.meta._jetpack_newsletter_access ).toBe( 'subscribers' );
	} );
} );
