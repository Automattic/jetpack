/**
 * WordPress dependencies
 */
import { useEffect, useMemo, useState } from '@wordpress/element';
import type { Option } from '@jetpack-premium-analytics/externals';

type UseElementsParams = {
	elements?: Option[];
	getElements?: () => Promise< Option[] >;
};

export default function useElements( { elements, getElements }: UseElementsParams ) {
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
		setIsLoading( true );
		getElements()
			.then( fetchedElements => {
				if ( cancelled ) {
					return;
				}

				setRecords(
					Array.isArray( fetchedElements ) && fetchedElements.length > 0
						? fetchedElements
						: staticElements
				);
			} )
			.catch( () => {
				if ( ! cancelled ) {
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
	}, [ getElements, staticElements ] );

	return {
		elements: records,
		isLoading,
	};
}
