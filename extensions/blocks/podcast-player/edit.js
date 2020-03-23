/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { useState, useCallback, useEffect } from '@wordpress/element';
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
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { BlockControls, BlockIcon, InspectorControls } from '@wordpress/block-editor';
import apiFetch from '@wordpress/api-fetch';
import { isURL } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { getValidatedAttributes } from '../../shared/get-validated-attributes';
import './editor.scss';
import { queueMusic } from './icons/';
import { isAtomicSite, isSimpleSite } from '../../shared/site-type-utils';
import attributesValidation from './attributes';
import PodcastPlayer from './components/podcast-player';

const DEFAULT_MIN_ITEMS = 1;
const DEFAULT_MAX_ITEMS = 10;

// Support page link.
const supportUrl =
	isSimpleSite() || isAtomicSite()
		? 'http://en.support.wordpress.com/wordpress-editor/blocks/podcast-player-block/'
		: 'https://jetpack.com/support/jetpack-blocks/podcast-player-block/';

const PodcastPlayerEdit = ( {
	attributes,
	setAttributes,
	noticeOperations: { createErrorNotice, removeAllNotices },
	noticeUI,
} ) => {
	// Validated attributes.
	const { url, itemsToShow, showCoverArt, showEpisodeDescription } = getValidatedAttributes(
		attributesValidation,
		attributes
	);

	// State.
	const [ editedUrl, setEditedUrl ] = useState( url || '' );
	const [ isEditing, setIsEditing ] = useState( false );
	const [ tracks, setTracks ] = useState( [] );

	useEffect( () => {
		setTracks( [] );
		apiFetch( {
			path: '/wpcom/v2/podcast-player?url=' + url,
		} ).then(
			data => {
				setTracks( data.tracks );
			},
			() => {
				// TODO: error.
			}
		);
	}, [ url ] );

	/**
	 * Check if the current URL of the Podcast RSS feed
	 * is valid. If so, set the block attribute and changes
	 * the edition mode.
	 * This function is bound to the onSubmit event for the form.
	 *
	 * @param {object} event Form on submit event object.
	 */
	const checkPodcastLink = useCallback( event => {
		event.preventDefault();
		removeAllNotices();

		if ( ! editedUrl ) {
			return;
		}

		const isValidURL = isURL( editedUrl );
		if ( ! isValidURL ) {
			createErrorNotice(
				! isValidURL
					? __( "Your podcast couldn't be embedded. Please double check your URL.", 'jetpack' )
					: ''
			);
			return;
		}

		setAttributes( { url: editedUrl } );
		setIsEditing( false );
	} );

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
						type="url"
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

	if ( ! tracks.length ) {
		return 'loading';
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
			</InspectorControls>
			<PodcastPlayer itemsToShow={ itemsToShow } tracks={ tracks } />
		</>
	);
};

export default withNotices( PodcastPlayerEdit );
