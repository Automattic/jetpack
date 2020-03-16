/**
 * External dependencies
 */
import { useState } from '@wordpress/element';
import {
	Button,
	Disabled,
	ExternalLink,
	PanelBody,
	Placeholder,
	RangeControl,
	TextControl,
	Toolbar,
	withNotices,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { BlockControls, BlockIcon, InspectorControls } from '@wordpress/block-editor';
import ServerSideRender from '@wordpress/server-side-render';
import { isURL } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { namespaceName } from './index';
import { getValidatedAttributes } from '../../shared/get-validated-attributes';
import './editor.scss';
import { edit, queueMusic } from './icons/';
import { isAtomicSite, isSimpleSite } from '../../shared/site-type-utils';
import attributesValidation from './attributes';

const DEFAULT_MIN_ITEMS = 1;
const DEFAULT_MAX_ITEMS = 10;

const handleSSRError = () => {
	return <p>{ __( 'Failed to load Block', 'jetpack' ) }</p>;
};

const PodcastPlayerEdit = ( {
	attributes,
	setAttributes,
	noticeOperations: { createErrorNotice, removeAllNotices },
	noticeUI,
} ) => {
	// Validated attributes.
	const { url, itemsToShow } = getValidatedAttributes( attributesValidation, attributes );

	// State.
	const [ editedUrl, setEditedUrl ] = useState( url || '' );
	const [ isEditing, setIsEditing ] = useState( false );

	/**
	 * Check if the current URL of the Podcast RSS feed
	 * is valid. If so, set the block attribute and changes
	 * the edition mode.
	 * This function is bound to the onSubmit event for the form.
	 *
	 * @param {object} event Form on submit event object.
	 */
	const checkPodcastLink = event => {
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
	};

	const supportLink =
		isSimpleSite() || isAtomicSite()
			? 'http://en.support.wordpress.com/wordpress-editor/blocks/podcast-player-block/'
			: 'https://jetpack.com/support/jetpack-blocks/podcast-player-block/';

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
						onChange={ setEditedUrl }
						className={ 'components-placeholder__input' }
					/>
					<Button isPrimary type="submit">
						{ __( 'Embed', 'jetpack' ) }
					</Button>
				</form>
				<div className="components-placeholder__learn-more">
					<ExternalLink href={ supportLink }>
						{ __( 'Learn more about embeds', 'jetpack' ) }
					</ExternalLink>
				</div>
			</Placeholder>
		);
	}

	const toolbarControls = [
		{
			icon: edit,
			title: __( 'Edit Podcast Feed URL', 'jetpack' ),
			onClick: () => setIsEditing( true ),
		},
	];

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
				</PanelBody>
			</InspectorControls>
			<Disabled>
				<ServerSideRender
					block={ namespaceName }
					attributes={ { url, itemsToShow } }
					EmptyResponsePlaceholder={ handleSSRError }
					ErrorResponsePlaceholder={ handleSSRError }
				/>
			</Disabled>
		</>
	);
};

export default withNotices( PodcastPlayerEdit );
