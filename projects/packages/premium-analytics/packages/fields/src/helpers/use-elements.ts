/**
 * WordPress dependencies
 */
import { useEffect, useMemo, useState } from '@wordpress/element';
import type { Option } from '@jetpack-premium-analytics/externals';

type UseElementsParams = {
	elements?: Option[];
	getElements?: () => Promise< Option[] >;
	/** Bump to read `getElements` again; the current list stays until the new one is in. */
	revision?: number;
};

export default function useElements( { elements, getElements, revision = 0 }: UseElementsParams ) {
	const staticElements = useMemo(
		() => ( Array.isArray( elements ) && elements.length > 0 ? elements : [] ),
		[ elements ]
	);

	const [ records, setRecords ] = useState< Option[] >( staticElements );
	const [ isLoading, setIsLoading ] = useState( false );

	useEffect( () => {
		if ( ! getElements ) {
			setRecords( staticElements );
			return;
		}

		let cancelled = false;
		const isRefresh = revision > 0;
		if ( ! isRefresh ) {
			setIsLoading( true );
		}
		getElements()
			.then( fetchedElements => {
				if ( cancelled ) {
					return;
				}

				if ( Array.isArray( fetchedElements ) && fetchedElements.length > 0 ) {
					setRecords( fetchedElements );
				} else if ( ! isRefresh ) {
					setRecords( staticElements );
				}
			} )
			.catch( () => {
				if ( ! cancelled && ! isRefresh ) {
					setRecords( staticElements );
				}
			} )
			.finally( () => {
				if ( ! cancelled ) {
					setIsLoading( false );
				}
			} );

		return () => {
			cancelled = true;
		};
	}, [ getElements, staticElements, revision ] );

	return {
		elements: records,
		isLoading,
	};
}
