/**
 * External dependencies
 */
import { useDispatch } from '@wordpress/data';
import { useState } from 'react';
/**
 * Internal dependencies
 */
import { STORE_ID } from '../../../state';
import useVideos from '../use-videos';

export const useFirstVideoPopover = ( videoId: number | string ) => {
	const dispatch = useDispatch( STORE_ID );
	const [ anchor, setAnchor ] = useState( null );
	const { firstUploadedVideoId, dismissedFirstVideoPopover } = useVideos();
	const showAddToPostPopover =
		Number( firstUploadedVideoId ) === Number( videoId ) && ! dismissedFirstVideoPopover;

	const closePopover = () => dispatch.dismissFirstVideoPopover();

	return {
		anchor,
		setAnchor,
		showAddToPostPopover,
		closePopover,
	};
};
