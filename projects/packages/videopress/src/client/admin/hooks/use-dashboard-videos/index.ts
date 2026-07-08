/**
 * External dependencies
 */
import { useDispatch } from '@wordpress/data';
import { useEffect, useMemo, useRef } from 'react';
/**
 * Internal dependencies
 */
import { STORE_ID } from '../../../state';
import { usePlan } from '../use-plan';
import { useSearchParams } from '../use-search-params';
import useVideos, { useLocalVideos } from '../use-videos';
import type { AdminVideo } from '../../types';

export const useDashboardVideos = () => {
	const { uploadVideo, uploadVideoFromLibrary, setVideosQuery } = useDispatch( STORE_ID );
	const {
		items,
		uploadErrors,
		uploading,
		uploadedVideoCount,
		isFetching,
		search,
		page,
		itemsPerPage,
		total,
	} = useVideos();
	const { items: localVideos, uploadedLocalVideoCount } = useLocalVideos();
	const { hasVideoPressPurchase } = usePlan();

	// Use a tempPage to catch changes in page from store and not URL
	const tempPage = useRef( page );

	/** Get the page number from the search parameters and set it to the state when the state is outdated */
	const searchParams = useSearchParams();
	// Fall back to 1: NaN would silently slip past the `< 1`/`> totalOfPages` bounds checks below.
	const parsedPageParam = parseInt( searchParams.getParam( 'page', '1' ), 10 );
	const pageFromSearchParam = Number.isNaN( parsedPageParam ) ? 1 : parsedPageParam;
	const searchFromSearchParam = searchParams.getParam( 'q', '' );
	const totalOfPages = Math.ceil( total / itemsPerPage );

	useEffect( () => {
		// when there are no search results, ensure that the current page number is 1
		if ( total === 0 && pageFromSearchParam !== 1 ) {
			// go back to page 1
			searchParams.deleteParam( 'page' );
			searchParams.update();
			return;
		}

		// when there are search results, ensure that the current page is between 1 and totalOfPages, inclusive
		if ( total > 0 && ( pageFromSearchParam < 1 || pageFromSearchParam > totalOfPages ) ) {
			// go back to page 1
			searchParams.deleteParam( 'page' );
			searchParams.update();
			return;
		}

		// react to a page param change
		if ( page !== pageFromSearchParam ) {
			// store changed and not url
			// update url to match store update
			if ( page !== tempPage.current ) {
				tempPage.current = page;
				searchParams.setParam( 'page', String( page ) );
				searchParams.update();
			} else {
				tempPage.current = pageFromSearchParam;
				setVideosQuery( {
					page: pageFromSearchParam,
				} );
			}

			return;
		}

		// react to a search param change
		if ( search !== searchFromSearchParam ) {
			setVideosQuery( {
				search: searchFromSearchParam,
			} );
		}
		// `tempPage.current` is intentionally excluded — including a ref's `.current` while mutating it inside the effect re-fires it in a loop.
	}, [ totalOfPages, page, pageFromSearchParam, search, searchFromSearchParam ] );

	// Stable placeholder list while fetching: deterministic IDs keyed on the
	// inputs that determine count, so child keys don't churn every render.
	const placeholders = useMemo< AdminVideo[] | null >( () => {
		if ( ! isFetching ) {
			return null;
		}
		const numPlaceholders = Math.max(
			1, // at least one placeholder
			Math.min( itemsPerPage, uploadedVideoCount - itemsPerPage * ( page - 1 ) ) // at most the number of videos in the page without query
		);
		/*
		 * Loading skeletons only carry an `id`; placeholder UI reads no other
		 * fields, so the cast to the full video shape is safe.
		 */
		return Array.from( { length: numPlaceholders }, ( _, i ) => ( {
			id: `placeholder-${ i }`,
		} ) ) as unknown as AdminVideo[];
	}, [ isFetching, itemsPerPage, uploadedVideoCount, page ] );

	// Do not show uploading videos if not in the first page or searching
	const videos =
		placeholders ??
		( page > 1 || Boolean( search ) ? items : [ ...uploadErrors, ...uploading, ...items ] );

	const hasVideos =
		uploadedVideoCount > 0 || isFetching || uploading?.length > 0 || uploadErrors?.length > 0;
	const hasLocalVideos = uploadedLocalVideoCount > 0;

	const handleFilesUpload = ( files: File[] ) => {
		if ( hasVideoPressPurchase ) {
			files.forEach( file => {
				uploadVideo( file );
			} );
		} else if ( files.length > 0 ) {
			uploadVideo( files[ 0 ] );
		}
	};

	const handleLocalVideoUpload = file => {
		uploadVideoFromLibrary( file );
	};

	return {
		videos,
		localVideos,
		uploadedVideoCount,
		uploadedLocalVideoCount,
		hasVideos,
		hasLocalVideos,
		handleFilesUpload,
		handleLocalVideoUpload,
		loading: isFetching,
		uploading: uploading?.length > 0 || uploadErrors?.length > 0,
		hasVideoPressPurchase,
	};
};
