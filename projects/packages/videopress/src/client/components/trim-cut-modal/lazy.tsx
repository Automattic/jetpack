import { lazy, Suspense } from '@wordpress/element';
import type { TrimCutModalProps } from './types';

const TrimCutModal = lazy( () => import( /* webpackChunkName: "trim-cut-modal" */ './index' ) );

/**
 * Load the trim editor only when its modal is opened.
 *
 * @param props - Modal props.
 * @return The lazily loaded modal.
 */
export default function LazyTrimCutModal( props: TrimCutModalProps ) {
	return (
		<Suspense fallback={ null }>
			<TrimCutModal { ...props } />
		</Suspense>
	);
}
