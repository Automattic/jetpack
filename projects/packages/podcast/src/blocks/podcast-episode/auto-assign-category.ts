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
declare global {
	interface Window {
		jetpackPodcastEpisodeBlock?: {
			podcastingCategoryId?: number;
		};
	}
}

export function registerAutoAssignCategory(): void {
	const editorStore = select( 'core/editor' ) as
		| {
				getCurrentPost: () => {
					id?: number;
					status?: string;
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
			// `getCurrentPost()` returns null only before the initial post
			// payload lands. Once it resolves to an object, the saved content
			// is whatever was on the server — empty is a valid value (auto
			// drafts, blank existing posts) and shouldn't keep us waiting.
			if ( ! post ) {
				return;
			}
			const content = post.content;
			const rawContent = typeof content === 'string' ? content : content?.raw ?? '';
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

		// Prefer the inline-localized category id (readable for any user who
		// can load the editor). `getEditedEntityRecord('root','site')` hits
		// `/wp/v2/settings`, which requires `manage_options`, so authors and
		// editors without that cap would otherwise silently skip the nudge.
		const localized = Number( window.jetpackPodcastEpisodeBlock?.podcastingCategoryId ) || 0;
		let podcastingCategoryId = localized;
		if ( ! podcastingCategoryId ) {
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
			podcastingCategoryId = Number( site?.podcasting_category_id ) || 0;
		}
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
