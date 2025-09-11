import { useCallback, useRef, useState } from 'react';

/**
 * Hook to detect if text content is truncated within its container.
 * Uses ResizeObserver to dynamically track changes in element size.
 *
 * @param enabled - Whether truncation detection should be active
 * @return Tuple of [refCallback, isTruncated] where refCallback should be attached to the text element
 */
export function useTextTruncation(
	enabled: boolean = true
): [ ( node: HTMLElement | null ) => void, boolean ] {
	const [ isTruncated, setIsTruncated ] = useState( false );
	const observerRef = useRef< ResizeObserver | null >( null );

	const refCallback = useCallback(
		( node: HTMLElement | null ) => {
			// Cleanup existing observer
			if ( observerRef.current ) {
				observerRef.current.disconnect();
				observerRef.current = null;
			}

			if ( node && enabled ) {
				const checkTruncation = () => {
					// Check if content width exceeds container width (indicates truncation)
					const truncated = node.scrollWidth > node.clientWidth;
					setIsTruncated( truncated );
				};

				// Initial check
				checkTruncation();

				// Watch for size changes
				const resizeObserver = new ResizeObserver( checkTruncation );
				resizeObserver.observe( node );
				observerRef.current = resizeObserver;
			} else {
				setIsTruncated( false );
			}
		},
		[ enabled ]
	);

	return [ refCallback, isTruncated ];
}
