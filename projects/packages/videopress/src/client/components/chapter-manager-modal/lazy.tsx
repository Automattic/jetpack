/**
 * External dependencies
 */
import { Suspense, lazy } from '@wordpress/element';
/**
 * Types
 */
import type { ChapterManagerModalProps } from './types';
import type { ReactElement } from 'react';

/*
 * The modal and its dependencies (the shared chapters editor UI among them)
 * load as their own chunk on first open, so hosts' initial bundles don't pay
 * for a rarely used editor.
 */
const ChapterManagerModal = lazy(
	() => import( /* webpackChunkName: "chapter-manager-modal" */ './index' )
);

/**
 * Lazy-loading wrapper for the chapter manager modal.
 *
 * Mounting this is what triggers the chunk download, so hosts should render
 * it only while the modal is open rather than keeping it mounted with
 * `isOpen: false`.
 *
 * @param props - Modal props (see {@link ChapterManagerModalProps}).
 * @return The lazily loaded modal.
 */
export default function LazyChapterManagerModal( props: ChapterManagerModalProps ): ReactElement {
	return (
		<Suspense fallback={ null }>
			<ChapterManagerModal { ...props } />
		</Suspense>
	);
}
