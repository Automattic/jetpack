/**
 * External dependencies
 */
import { Suspense, lazy } from '@wordpress/element';
/**
 * Types
 */
import type { CaptionManagerModalProps } from './types';
import type { ReactElement } from 'react';

/*
 * The modal and its dependencies (notably @tanstack/react-query, which no
 * other block-editor code uses) load as their own chunk on first open, so
 * hosts' initial bundles don't pay for a rarely used editor.
 */
const CaptionManagerModal = lazy(
	() => import( /* webpackChunkName: "caption-manager-modal" */ './index' )
);

/**
 * Lazy-loading wrapper for the caption manager modal.
 *
 * Mounting this is what triggers the chunk download, so hosts should render
 * it only while the modal is open rather than keeping it mounted with
 * `isOpen: false`.
 *
 * @param props - Modal props (see {@link CaptionManagerModalProps}).
 * @return The lazily loaded modal.
 */
export default function LazyCaptionManagerModal( props: CaptionManagerModalProps ): ReactElement {
	return (
		<Suspense fallback={ null }>
			<CaptionManagerModal { ...props } />
		</Suspense>
	);
}
