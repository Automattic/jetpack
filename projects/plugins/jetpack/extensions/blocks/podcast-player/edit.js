import { isAtomicSite, isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
import {
	BlockControls,
	InspectorControls,
	withColors,
	PanelColorSettings,
	ContrastChecker,
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import {
	Button,
	ExternalLink,
	PanelBody,
	Placeholder,
	RangeControl,
	TextControl,
	ToolbarButton,
	ToolbarGroup,
	withNotices,
	ToggleControl,
	Spinner,
	ComboboxControl,
} from '@wordpress/components';
import { compose, withInstanceId } from '@wordpress/compose';
import { withDispatch } from '@wordpress/data';
import { useCallback, useEffect, useState, useRef, useReducer, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { isURL, prependHTTP } from '@wordpress/url';
import debugFactory from 'debug';
import { debounce, noop } from 'lodash';
import { applyFallbackStyles } from '../../shared/apply-fallback-styles';
import { maybeCopyElementsToSiteEditorContext } from '../../shared/block-editor-asset-loader';
import { getValidatedAttributes } from '../../shared/get-validated-attributes';
import { fetchPodcastFeed, fetchTrackQuantity } from './api';
import attributesValidation from './attributes';
import PodcastPlayer from './components/podcast-player';
import { PODCAST_FEED, EMBED_BLOCK } from './constants';
import { queueMusic } from './icons/';
import { podcastPlayerReducer, actions } from './state';
import { makeCancellable } from './utils';

import './editor.scss';

const DEFAULT_MIN_ITEMS = 1;
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
	replaceWithEmbedBlock,
} ) => {
	// Validated attributes.
	const validatedAttributes = getValidatedAttributes( attributesValidation, attributes );
	const {
		url,
		selectedEpisodes,
		itemsToShow,
		showCoverArt,
		showEpisodeTitle,
		showEpisodeDescription,
		exampleFeedData,
	} = validatedAttributes;

	const playerId = `jetpack-podcast-player-block-${ instanceId }`;

	const [ hasMigratedStyles, setHasMigratedStyles ] = useState( false );
	const [ defaultMaxItems, setDefaultMaxItems ] = useState( 10 );

	// State.
	const cancellableFetch = useRef();
	const [ { selectedGuid, checkUrl, ...state }, dispatch ] = useReducer( podcastPlayerReducer, {
		editedUrl: url || '',
		isEditing: ! url && ! exampleFeedData,
		isLoading: false,
		feedData: exampleFeedData || {},
		isInteractive: false,
		selectedGuid: selectedEpisodes?.[ 0 ]?.guid,
		checkUrl: url || '',
	} );

	const fetchFeed = useMemo(
		() =>
			debounce( requestParams => {
				dispatch( { type: actions.START_FETCH } );
				cancellableFetch.current?.cancel();
				cancellableFetch.current = makeCancellable(
					fetchPodcastFeed( { ...requestParams, fetchEpisodeOptions: true } )
				);

				cancellableFetch.current.promise.then(
					response => {
						removeAllNotices();
						if ( response?.isCanceled ) {
							debug( 'Block was unmounted during fetch', response );
							return; // bail if canceled to avoid setting state
						}

						// Check what type of response we got and act accordingly.
						switch ( response?.type ) {
							case PODCAST_FEED:
								setAttributes( {
									url: requestParams.url,
									selectedEpisodes: requestParams.guids.map( guid => ( { guid } ) ),
								} );
								return dispatch( { type: actions.FEED_RECEIVED, payload: response.data } );
							case EMBED_BLOCK:
								return replaceWithEmbedBlock();
						}
					},
					error => {
						if ( error?.isCanceled ) {
							debug( 'Block was unmounted during fetch', error );
							return; // bail if canceled to avoid setting state
						}

						// Show error and allow to edit URL.
						debug( 'feed error', error );
						removeAllNotices();
						createErrorNotice(
							// Error messages already come localized.
							error.message ||
								// Fallback to a generic message.
								__( "Your podcast couldn't be embedded. Please double check your URL.", 'jetpack' )
						);
						dispatch( { type: actions.START_EDITING } );
					}
				);
			}, 300 ),
		[ replaceWithEmbedBlock, setAttributes, createErrorNotice, removeAllNotices ]
	);

	// Call once on mount or unmount (the return callback).
	useEffect( () => {
		return () => {
			cancellableFetch?.current?.cancel?.();
		};
	}, [] );

	// The Podcast player audio element requires wpmedialement styles.
	// These aren't available in the Site Editor context, so we have to copy them in.
	const podCastPlayerRef = useCallback(
		node => {
			if ( node !== null && ! hasMigratedStyles ) {
				maybeCopyElementsToSiteEditorContext(
					[ 'link#mediaelement-css', 'link#wp-mediaelement-css' ],
					node
				);
				setHasMigratedStyles( true );
			}
		},
		[ hasMigratedStyles ]
	);

	// Load RSS feed initially and when the feed or selected episode changes.
	useEffect( () => {
		// Don't do anything if no url is set.
		if ( '' === checkUrl ) {
			return;
		}

		fetchFeed( {
			url: checkUrl,
			guids: selectedGuid ? [ selectedGuid ] : [],
		} );

		return () => cancellableFetch?.current?.cancel?.();
	}, [ fetchFeed, checkUrl, selectedGuid ] );

	// Retrieve tracks quantity to fetch; the jetpack_podcast_helper_tracks_quantity filter value.
	useEffect( () => {
		fetchTrackQuantity().then( response => {
			setDefaultMaxItems( response );
		} );
	}, [] );

	// Make sure itemsToShow is 1 when we have a selected episode
	useEffect( () => {
		if ( selectedGuid && 1 !== itemsToShow ) {
			setAttributes( { itemsToShow: 1 } );
		}
	}, [ selectedGuid, itemsToShow, setAttributes ] );

	// Bring back the overlay after block gets deselected.
	useEffect( () => {
		if ( ! isSelected && state.isInteractive ) {
			dispatch( { type: actions.PREVENT_INTERACTIONS } );
		}
	}, [ isSelected, state.isInteractive ] );

	/**
	 * Check if the current URL of the Podcast RSS feed is valid. If so, set the
	 * block attribute and changes the edition mode. This function is bound to the
	 * onSubmit event for the form.
	 *
	 * @param {object} event - Form on submit event object.
	 */
	const checkPodcastLink = event => {
		event.preventDefault();

		if ( '' === state.editedUrl ) {
			return;
		}

		/*
		 * Ensure URL has `http` appended to it (if it doesn't already) before we
		 * accept it as the entered URL.
		 */
		const prependedURL = prependHTTP( state.editedUrl );

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
		if ( prependedURL === checkUrl ) {
			// Reset the feedData, so that we display the spinner.
			dispatch( { type: actions.CLEAR_FEED } );
			fetchFeed( {
				url: checkUrl,
				guids: selectedEpisodes[ 0 ]?.guid ? [ selectedEpisodes[ 0 ].guid ] : [],
			} );
		} else {
			dispatch( { type: actions.CHECK_URL, payload: prependedURL } );
		}

		/*
		 * Also update the temporary `input` value in order that clicking `Replace`
		 * in the UI will show the "corrected" version of the URL (ie: with `http`
		 * prepended if it wasn't originally present).
		 */
		dispatch( { type: actions.FINISH_EDITING, payload: prependedURL } );
	};

	if ( state.isEditing ) {
		return (
			<Placeholder
				icon={ queueMusic }
				label={ __( 'Podcast Player', 'jetpack' ) }
				instructions={ __( 'Enter your podcast RSS feed URL.', 'jetpack' ) }
				className={ 'jetpack-podcast-player__placeholder' }
			>
				<form onSubmit={ checkPodcastLink }>
					{ noticeUI }
					<TextControl
						type="text"
						inputMode="url"
						placeholder={ __( 'Enter URL here…', 'jetpack' ) }
						value={ state.editedUrl }
						className={ 'components-placeholder__input' }
						onChange={ editedUrl => dispatch( { type: actions.EDIT_URL, payload: editedUrl } ) }
					/>
					<Button variant="primary" type="submit">
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

	// With no tracks data, this is either the first load or the URL has changed
	// and we need the data to refresh before displaying the other controls.
	if ( ! state.feedData.tracks?.length ) {
		return (
			<Placeholder
				icon={ queueMusic }
				label={ __( 'Podcast Player', 'jetpack' ) }
				instructions={ __( 'Loading podcast feed…', 'jetpack' ) }
			>
				<Spinner />
			</Placeholder>
		);
	}

	const createColorChangeHandler = ( colorAttr, handler ) => color => {
		setAttributes( { [ colorAttr ]: color } );
		handler( color );
	};

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						aria-label={ __( 'Edit Podcast Feed URL', 'jetpack' ) }
						onClick={ () => dispatch( { type: actions.START_EDITING } ) }
					>
						{ __( 'Replace', 'jetpack' ) }
					</ToolbarButton>
				</ToolbarGroup>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Podcast settings', 'jetpack' ) }>
					{ ( ComboboxControl || 0 === selectedEpisodes.length ) && (
						<RangeControl
							label={ __( 'Number of items', 'jetpack' ) }
							value={ itemsToShow }
							onChange={ value => setAttributes( { itemsToShow: selectedGuid ? 1 : value } ) }
							min={ DEFAULT_MIN_ITEMS }
							max={ defaultMaxItems }
							required
							disabled={ !! selectedGuid }
						/>
					) }
					{ ComboboxControl && (
						<ComboboxControl
							className="jetpack-podcast-player__episode-selector"
							value={ selectedGuid }
							onChange={ guid => dispatch( { type: actions.SELECT_EPISODE, payload: guid } ) }
							options={ state.feedData.options || [] }
							label={ __( 'Episode', 'jetpack' ) }
							onFilterValueChange={ noop }
						/>
					) }
					<ToggleControl
						label={ __( 'Show Cover Art', 'jetpack' ) }
						checked={ showCoverArt }
						onChange={ value => setAttributes( { showCoverArt: value } ) }
					/>

					<ToggleControl
						label={ __( 'Show Episode Title', 'jetpack' ) }
						checked={ showEpisodeTitle }
						onChange={ value => setAttributes( { showEpisodeTitle: value } ) }
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
							onChange: createColorChangeHandler( 'hexPrimaryColor', setPrimaryColor ),
							label: __( 'Primary Color', 'jetpack' ),
						},
						{
							value: secondaryColorProp.color,
							onChange: createColorChangeHandler( 'hexSecondaryColor', setSecondaryColor ),
							label: __( 'Secondary Color', 'jetpack' ),
						},
						{
							value: backgroundColorProp.color,
							onChange: createColorChangeHandler( 'hexBackgroundColor', setBackgroundColor ),
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

			<div id={ playerId } className={ className } ref={ podCastPlayerRef }>
				<PodcastPlayer
					playerId={ playerId }
					attributes={ validatedAttributes }
					tracks={ state.feedData.tracks }
					cover={ state.feedData.cover }
					title={ state.feedData.title }
					link={ state.feedData.link }
				/>
				{ /*
				 * Disabled because the overlay div doesn't actually have a role or
				 * functionality as far as the user is concerned. We're just catching
				 * the first click so that the block can be selected without
				 * interacting with the embed preview that the overlay covers.
				 */ }
				{ /* eslint-disable jsx-a11y/no-static-element-interactions */ }
				{ ! state.isInteractive && ! state.isLoading && (
					<div
						className="jetpack-podcast-player__interactive-overlay"
						onMouseUp={ () => dispatch( { type: actions.MAKE_INTERACTIVE } ) }
					/>
				) }
				{ /* eslint-enable jsx-a11y/no-static-element-interactions */ }
				{ state.isLoading && (
					<div className="jetpack-podcast-player__loading-overlay">
						<Spinner />
					</div>
				) }
			</div>
		</>
	);
};

export default compose( [
	withDispatch( ( dispatch, { clientId, attributes } ) => {
		return {
			replaceWithEmbedBlock() {
				dispatch( 'core/block-editor' ).replaceBlock(
					clientId,
					createBlock( 'core/embed', {
						url: attributes.url,
					} )
				);
			},
		};
	} ),
	withColors( 'backgroundColor', { primaryColor: 'color' }, { secondaryColor: 'color' } ),
	withNotices,
	withInstanceId,
	applyFallbackStyles,
] )( PodcastPlayerEdit );
