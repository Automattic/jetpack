/**
 * External dependencies
 */
import debugFactory from 'debug';

/**
 * WordPress dependencies
 */
import { useState, useCallback, useEffect, useRef } from '@wordpress/element';
import {
	Button,
	ExternalLink,
	PanelBody,
	Placeholder,
	RangeControl,
	TextControl,
	Toolbar,
	withNotices,
	ToggleControl,
	Spinner,
} from '@wordpress/components';
import { compose, withInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import {
	BlockControls,
	BlockIcon,
	InspectorControls,
	withColors,
	PanelColorSettings,
	ContrastChecker,
} from '@wordpress/block-editor';

import apiFetch from '@wordpress/api-fetch';
import { isURL, prependHTTP } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { getValidatedAttributes } from '../../shared/get-validated-attributes';
import './editor.scss';
import { queueMusic } from './icons/';
import { isAtomicSite, isSimpleSite } from '../../shared/site-type-utils';
import attributesValidation from './attributes';
import PodcastPlayer from './components/podcast-player';
import { makeCancellable } from './utils';
import { applyFallbackStyles } from '../../shared/apply-fallback-styles';

const DEFAULT_MIN_ITEMS = 1;
const DEFAULT_MAX_ITEMS = 10;

const debug = debugFactory( 'jetpack:podcast-player:edit' );

// Support page link.
const supportUrl =
	isSimpleSite() || isAtomicSite()
		? 'http://en.support.wordpress.com/wordpress-editor/blocks/podcast-player-block/'
		: 'https://jetpack.com/support/jetpack-blocks/podcast-player-block/';

const PodcastPlayerEdit = ( {
	instanceId,
	className,
	attributes,
	setAttributes,
	noticeOperations: { createErrorNotice, removeAllNotices },
	noticeUI,
	primaryColor: primaryColorProp,
	setPrimaryColor,
	secondaryColor: secondaryColorProp,
	setSecondaryColor,
	fallbackTextColor,
	backgroundColor: backgroundColorProp,
	setBackgroundColor,
	fallbackBackgroundColor,
	isSelected,
} ) => {
	// Validated attributes.
	const validatedAttributes = getValidatedAttributes( attributesValidation, attributes );
	const { url, itemsToShow, showCoverArt, showEpisodeDescription } = validatedAttributes;

	const playerId = `jetpack-podcast-player-block-${ instanceId }`;

	// State.
	const [ editedUrl, setEditedUrl ] = useState( url || '' );
	const [ isEditing, setIsEditing ] = useState( false );
	const [ feedData, setFeedData ] = useState( {} );
	const cancellableFetch = useRef();
	const [ isInteractive, setIsInteractive ] = useState( false );

	const fetchFeed = useCallback(
		urlToFetch => {
			const encodedURL = encodeURIComponent( urlToFetch );

			cancellableFetch.current = makeCancellable(
				apiFetch( {
					path: '/wpcom/v2/podcast-player?url=' + encodedURL,
				} )
			);

			cancellableFetch.current.promise.then(
				data => {
					if ( data?.isCanceled ) {
						debug( 'Block was unmounted during fetch', data );
						return; // bail if canceled to avoid setting state
					}
					// Store feed data.
					setFeedData( data );
				},
				error => {
					if ( error?.isCanceled ) {
						debug( 'Block was unmounted during fetch', error );
						return; // bail if canceled to avoid setting state
					}
					if ( /\bspotify\b/i.test( encodedURL ) ) {
						createErrorNotice(
							__(
								"It looks like you're trying to embed a podcast hosted on Spotify. Please use the Spotify block instead.",
								'jetpack'
							)
						);
					} else {
						// Show error and allow to edit URL.
						debug( 'feed error', error );
						createErrorNotice(
							__( "Your podcast couldn't be embedded. Please double check your URL.", 'jetpack' )
						);
					}
					setIsEditing( true );
				}
			);
		},
		[ createErrorNotice ]
	);

	useEffect( () => {
		return () => {
			cancellableFetch?.current?.cancel?.();
		};
	}, [] );

	// Load RSS feed.
	useEffect( () => {
		// Clean state.
		setFeedData( {} );
		removeAllNotices();

		// Don't do anything if no url is set.
		if ( ! url ) {
			return;
		}

		fetchFeed( url );
	}, [ fetchFeed, removeAllNotices, url ] );

	// Bring back the overlay after block gets deselected.
	useEffect( () => {
		if ( ! isSelected && isInteractive ) {
			setIsInteractive( false );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ isSelected ] );

	/**
	 * Check if the current URL of the Podcast RSS feed
	 * is valid. If so, set the block attribute and changes
	 * the edition mode.
	 * This function is bound to the onSubmit event for the form.
	 *
	 * @param {object} event - Form on submit event object.
	 */
	const checkPodcastLink = useCallback(
		event => {
			event.preventDefault();
			removeAllNotices();

			if ( ! editedUrl ) {
				return;
			}

			// Ensure URL has `http` appended to it (if it doesn't already) before
			// we accept it as the entered URL.
			const prependedURL = prependHTTP( editedUrl );

			if ( ! isURL( prependedURL ) ) {
				createErrorNotice(
					__( "Your podcast couldn't be embedded. Please double check your URL.", 'jetpack' )
				);
				return;
			}

			/*
			 * Short-circuit feed fetching if we tried before, use useEffect otherwise.
			 * @see {@link https://github.com/Automattic/jetpack/pull/15213}
			 */
			if ( prependedURL === url ) {
				fetchFeed( url );
			} else {
				setAttributes( { url: prependedURL } );
			}

			// Also update the temporary `input` value in order that clicking
			// `Replace` in the UI will show the "corrected" version of the URL
			// (ie: with `http` prepended if it wasn't originally present).
			setEditedUrl( prependedURL );
			setIsEditing( false );
		},
		[ editedUrl, url, fetchFeed, createErrorNotice, removeAllNotices, setAttributes ]
	);

	if ( isEditing || ! url ) {
		return (
			<Placeholder
				icon={ <BlockIcon icon={ queueMusic } /> }
				label={ __( 'Podcast Player', 'jetpack' ) }
				instructions={ __( 'Enter your podcast RSS feed URL.', 'jetpack' ) }
			>
				<form onSubmit={ checkPodcastLink }>
					{ noticeUI }
					<TextControl
						type="text"
						inputMode="url"
						placeholder={ __( 'Enter URL here…', 'jetpack' ) }
						value={ editedUrl || '' }
						className={ 'components-placeholder__input' }
						onChange={ setEditedUrl }
					/>
					<Button isPrimary type="submit">
						{ __( 'Embed', 'jetpack' ) }
					</Button>
				</form>
				<div className="components-placeholder__learn-more">
					<ExternalLink href={ supportUrl }>
						{ __( 'Learn more about embeds', 'jetpack' ) }
					</ExternalLink>
				</div>
			</Placeholder>
		);
	}

	const toolbarControls = [
		{
			title: __( 'Edit Podcast Feed URL', 'jetpack' ),
			onClick: () => setIsEditing( true ),
			extraProps: {
				children: __( 'Replace', 'jetpack' ),
			},
		},
	];

	// Loading state for fetching the feed.
	if ( ! feedData.tracks || ! feedData.tracks.length ) {
		return (
			<Placeholder
				icon={ <BlockIcon icon={ queueMusic } /> }
				label={ __( 'Podcast Player', 'jetpack' ) }
				instructions={ __( 'Loading podcast feed…', 'jetpack' ) }
			>
				<Spinner />
			</Placeholder>
		);
	}

	return (
		<>
			<BlockControls>
				<Toolbar controls={ toolbarControls } />
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Podcast settings', 'jetpack' ) }>
					<RangeControl
						label={ __( 'Number of items', 'jetpack' ) }
						value={ itemsToShow }
						onChange={ value => setAttributes( { itemsToShow: value } ) }
						min={ DEFAULT_MIN_ITEMS }
						max={ DEFAULT_MAX_ITEMS }
						required
					/>

					<ToggleControl
						label={ __( 'Show Cover Art', 'jetpack' ) }
						checked={ showCoverArt }
						onChange={ value => setAttributes( { showCoverArt: value } ) }
					/>

					<ToggleControl
						label={ __( 'Show Episode Description', 'jetpack' ) }
						checked={ showEpisodeDescription }
						onChange={ value => setAttributes( { showEpisodeDescription: value } ) }
					/>
				</PanelBody>
				<PanelColorSettings
					title={ __( 'Color Settings', 'jetpack' ) }
					colorSettings={ [
						{
							value: primaryColorProp.color,
							onChange: setPrimaryColor,
							label: __( 'Primary Color', 'jetpack' ),
						},
						{
							value: secondaryColorProp.color,
							onChange: setSecondaryColor,
							label: __( 'Secondary Color', 'jetpack' ),
						},
						{
							value: backgroundColorProp.color,
							onChange: setBackgroundColor,
							label: __( 'Background Color', 'jetpack' ),
						},
					] }
				>
					<ContrastChecker
						isLargeText={ false }
						textColor={ secondaryColorProp.color }
						backgroundColor={ backgroundColorProp.color }
						fallbackBackgroundColor={ fallbackBackgroundColor }
						fallbackTextColor={ fallbackTextColor }
					/>
				</PanelColorSettings>
			</InspectorControls>

			<div id={ playerId } className={ className }>
				<PodcastPlayer
					playerId={ playerId }
					attributes={ validatedAttributes }
					tracks={ feedData.tracks }
					cover={ feedData.cover }
					title={ feedData.title }
					link={ feedData.link }
				/>
				{
					// Disabled because the overlay div doesn't actually have a role or functionality
					// as far as the user is concerned. We're just catching the first click so that
					// the block can be selected without interacting with the embed preview that the overlay covers.
					/* eslint-disable jsx-a11y/no-static-element-interactions */
				 }
				{ ! isInteractive && (
					<div
						className="jetpack-podcast-player__interactive-overlay"
						onMouseUp={ () => setIsInteractive( true ) }
					/>
				) }
				{ /* eslint-enable jsx-a11y/no-static-element-interactions */ }
			</div>
		</>
	);
};

export default compose( [
	withColors( 'backgroundColor', { primaryColor: 'color' }, { secondaryColor: 'color' } ),
	withNotices,
	withInstanceId,
	applyFallbackStyles,
] )( PodcastPlayerEdit );
