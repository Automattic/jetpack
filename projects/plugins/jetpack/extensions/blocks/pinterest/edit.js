/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import {
	Placeholder,
	SandBox,
	Button,
	Spinner,
	ToolbarButton,
	ToolbarGroup,
	withNotices,
} from '@wordpress/components';
import { BlockControls, BlockIcon } from '@wordpress/block-editor';
import { createRef, useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { fallback, pinType } from './utils';
import PinterestControls from './controls';
import { icon, PINTEREST_EXAMPLE_URL } from '.';
import useTestPinterestEmbedUrl from './hooks/use-test-pinterest-embed-url';
import useFetchGiphyData from "../gif/hooks/use-fetch-giphy-data";

function PinterestEdit( {
	attributes,
	isSelected,
	className,
	noticeOperations,
	noticeUI,
	setAttributes,
} ) {
	const { url, } = attributes;
	const { isFetching, pinterestUrl, testUrl } = useFetchGiphyData();
	const [ isInteractive, setIsInteractive ] = useState( false );
	const [ isEditing, setIsEditing ] = useState( false );

	/**
	 *
	 * @param newUrl string A new Pinterest URL
	 */
	const setUrl = ( newUrl ) => {
		if ( ! newUrl || PINTEREST_EXAMPLE_URL === newUrl ) {
			return;
		}
	};

	// Set the URL when the component mounts.
	useEffect( () => {
		setUrl( url );
	}, [] );

	/*
		We only want to change `isInteractive` when the block is not selected, because changing it when
		the block becomes selected makes the overlap disappear too early. Hiding the overlay
		happens on mouseup when the overlay is clicked.
	*/
	useEffect( () => {
		if ( ! isSelected && isInteractive ) {
			setIsInteractive( false );
		}
	}, [ isSelected, isInteractive ] );
}

export default withNotices( PinterestEdit );
