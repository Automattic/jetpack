import type * as BlockEditorSelectors from '@wordpress/block-editor/store/selectors';

export interface BlockEditorStore {
	selectors: {
		[ key in keyof typeof BlockEditorSelectors ]: ( typeof BlockEditorSelectors )[ key ];
	};
}
