/**
 * External dependencies
 */
import { Tabs as BaseUITabs } from '@base-ui-components/react/tabs';
/**
 * WordPress dependencies
 */
import { useMergeRefs } from '@wordpress/compose';
import clsx from 'clsx';
import { forwardRef, useState, useEffect, useCallback, isValidElement, cloneElement } from 'react';
/**
 * Internal dependencies
 */
import './style.scss';
import type { TabListProps } from './types.ts';

const DEFAULT_SCROLL_MARGIN = 0;

/**
 * Groups the individual tab buttons.
 *
 * `Tabs` is a collection of React components that combine to render
 * an [ARIA-compliant tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).
 */
export const List = forwardRef< HTMLDivElement, TabListProps >( function TabList(
	{ children, density = 'default', className, activateOnFocus, render, ...otherProps },
	forwardedRef
) {
	const [ listEl, setListEl ] = useState< HTMLDivElement | null >( null );
	const [ overflow, setOverflow ] = useState< {
		first: boolean;
		last: boolean;
	} >( {
		first: false,
		last: false,
	} );

	/**
	 * Checks if list is overflowing when it scrolls or resizes.
	 */
	useEffect( () => {
		if ( ! listEl ) {
			return;
		}

		// Grab a local reference to the list element to ensure it remains stable
		// during the effect and the event listeners.
		const localListEl = listEl;

		/**
		 * Measures if the tab list is overflowing horizontally.
		 */
		function measureOverflow() {
			if ( ! localListEl ) {
				setOverflow( {
					first: false,
					last: false,
				} );
				return;
			}

			const { scrollWidth, clientWidth, scrollLeft } = localListEl;

			setOverflow( {
				first: scrollLeft > DEFAULT_SCROLL_MARGIN,
				last: scrollLeft + clientWidth < scrollWidth - DEFAULT_SCROLL_MARGIN,
			} );
		}

		const resizeObserver = new ResizeObserver( measureOverflow );
		resizeObserver.observe( localListEl );
		let scrollTick = false;
		/**
		 * Throttles overflow measurement on scroll using requestAnimationFrame.
		 */
		function throttleMeasureOverflowOnScroll() {
			if ( ! scrollTick ) {
				requestAnimationFrame( () => {
					measureOverflow();
					scrollTick = false;
				} );
				scrollTick = true;
			}
		}
		localListEl.addEventListener( 'scroll', throttleMeasureOverflowOnScroll, { passive: true } );

		// Initial check.
		measureOverflow();

		return () => {
			localListEl.removeEventListener( 'scroll', throttleMeasureOverflowOnScroll );
			resizeObserver.disconnect();
		};
	}, [ listEl ] );

	const setListElRef = useCallback( el => setListEl( el ), [] );
	const mergedListRef = useMergeRefs( [ forwardedRef, setListElRef ] );

	const renderTabList = useCallback(
		( props, state ) => {
			// Fallback to -1 to prevent browsers from making the tablist
			// tabbable when it is a scrolling container.
			const newProps = {
				...props,
				tabIndex: props.tabIndex ?? -1,
			};

			if ( isValidElement( render ) ) {
				return cloneElement( render, newProps );
			} else if ( typeof render === 'function' ) {
				return render( newProps, state );
			}
			return <div { ...newProps } />;
		},
		[ render ]
	);

	return (
		<BaseUITabs.List
			ref={ mergedListRef }
			activateOnFocus={ activateOnFocus }
			data-select-on-move={ activateOnFocus ? 'true' : 'false' }
			className={ clsx(
				'jp-forms-tabs__tablist',
				overflow.first && 'jp-forms-tabs__is-overflowing-first',
				overflow.last && 'jp-forms-tabs__is-overflowing-last',
				`jp-forms-tabs__has-${ density }-density`,
				className
			) }
			render={ renderTabList }
			{ ...otherProps }
		>
			{ children }
			<BaseUITabs.Indicator className="jp-forms-tabs__indicator" />
		</BaseUITabs.List>
	);
} );
