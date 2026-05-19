import { dispatch, select, subscribe } from '@wordpress/data';

const PODCAST_BLOCK = 'jetpack/podcast-episode';

/**
 * Watches the post editor for a freshly-inserted Podcast Episode block and
 * assigns the configured podcasting category to the post if it doesn't already
 * have it. Fires once per editor session.
 *
 * Why: the podcasting feed and dashboard rely on the show category to scope
 * episodes. Users were inserting the block and publishing without realizing
 * the category was the gate, leaving the post invisible to the feed.
 */
export function registerAutoAssignCategory(): void {
	const editorStore = select( 'core/editor' ) as
		| {
				getCurrentPost: () => {
					content?: string | { raw?: string };
				} | null;
				getEditedPostAttribute: ( name: string ) => unknown;
				isCleanNewPost?: () => boolean;
		  }
		| undefined;

	// Contexts without `core/editor` (site editor, widgets, etc.) are out of
	// scope — the block can only bind to a post's categories.
	if ( ! editorStore ) {
		return;
	}

	let alreadyAssigned = false;
	// `null` = haven't resolved the saved post content yet. Once resolved, the
	// value tells us whether the block was already present in the saved
	// version (so we shouldn't re-touch the user's category choice).
	let savedHadBlock: boolean | null = null;

	subscribe( () => {
		if ( alreadyAssigned || savedHadBlock === true ) {
			return;
		}

		if ( savedHadBlock === null ) {
			const post = editorStore.getCurrentPost();
			if ( ! post ) {
				return;
			}
			const isNew = editorStore.isCleanNewPost?.() ?? false;
			const content = post.content;
			const rawContent = typeof content === 'string' ? content : content?.raw ?? '';
			if ( ! isNew && ! rawContent ) {
				// Existing post still hydrating; try again on the next tick.
				return;
			}
			savedHadBlock = rawContent.includes( '<!-- wp:' + PODCAST_BLOCK );
			if ( savedHadBlock ) {
				return;
			}
		}

		const blockEditor = select( 'core/block-editor' ) as
			| { getBlocksByName: ( name: string ) => string[] }
			| undefined;
		if ( ! blockEditor ) {
			return;
		}
		if ( blockEditor.getBlocksByName( PODCAST_BLOCK ).length === 0 ) {
			return;
		}

		const coreStore = select( 'core' ) as
			| {
					getEditedEntityRecord: (
						kind: string,
						name: string,
						key?: number | string
					) => { podcasting_category_id?: number } | null;
			  }
			| undefined;
		const site = coreStore?.getEditedEntityRecord( 'root', 'site' );
		const podcastingCategoryId = Number( site?.podcasting_category_id ) || 0;
		if ( ! podcastingCategoryId ) {
			return;
		}

		const currentCategories = editorStore.getEditedPostAttribute( 'categories' );
		if ( ! Array.isArray( currentCategories ) ) {
			return;
		}
		if ( currentCategories.includes( podcastingCategoryId ) ) {
			return;
		}

		alreadyAssigned = true;
		( dispatch( 'core/editor' ) as { editPost: ( patch: object ) => void } ).editPost( {
			categories: [ ...currentCategories, podcastingCategoryId ],
		} );
	} );
}
