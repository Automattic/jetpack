import wpcomRequest from 'wpcom-proxy-request';

type HasAddedTagsResult = {
	added_tags: number;
	success: boolean;
};

type OnSaveTagsCallback = ( addedTags: number ) => void;
const useAddTagsToPost = ( postId: number, tags: string[], onSaveTags: OnSaveTagsCallback ) => {
	/**
	 * Save tags
	 */
	async function saveTags() {
		let addedTags = 0;
		try {
			const result = await wpcomRequest< HasAddedTagsResult >( {
				method: 'POST',
				path: `read/sites/${ postId }/tags/add`,
				apiNamespace: 'wpcom/v2',
				body: { tags },
			} );
			addedTags = result.added_tags ?? 0;
		} catch ( error ) {
			// eslint-disable-next-line no-console
			console.error( 'Error: Unable to add tags. Reason: %s', JSON.stringify( error ) );
		}
		onSaveTags( addedTags );
	}
	return { saveTags };
};

export default useAddTagsToPost;
