/* eslint-disable no-unused-vars */

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
	Notice,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { BlockControls, BlockIcon, InspectorControls } from '@wordpress/block-editor';
import ServerSideRender from '@wordpress/server-side-render';
import { isURL } from '@wordpress/url';

/**
 * Internal dependencies
 */
import './editor.scss';
import { edit, queueMusic } from './icons/';

const DEFAULT_MIN_ITEMS = 1;
const DEFAULT_MAX_ITEMS = 10;

const handleSSRError = () => {
	return <p>{ __( 'Failed to load Block', 'jetpack' ) }</p>;
};

const PodcastPlayerEdit = ( { attributes, setAttributes } ) => {
	// Block attributes.
	const { url, itemsToShow } = attributes;

	// State.
	const [ editing, setEditing ] = useState( ! url );
	const [ urlError, setUrlError ] = useState( '' );

	const onSubmitURL = event => {
		event.preventDefault();

		if ( url ) {
			const isValidURL = isURL( url );

			setEditing( ! isValidURL );
			setUrlError(
				! isValidURL
					? __( 'The URL you entered is invalid. Please check and try again.', 'jetpack' )
					: ''
			);
		}
	};

	if ( editing ) {
		return (
			<Placeholder
				icon={ <BlockIcon icon={ queueMusic } /> }
				label={ __( 'Podcast Player', 'jetpack' ) }
				instructions={ __( 'Paste a link to your Podcast RSS feed.', 'jetpack' ) }
			>
				<form onSubmit={ onSubmitURL }>
					{ urlError && <Notice>{ urlError }</Notice> }
					<TextControl
						type="url"
						placeholder={ __( 'Enter URL here…', 'jetpack' ) }
						value={ url || '' }
						onChange={ value => setAttributes( { url: value } ) }
						className={ 'components-placeholder__input' }
					/>
					<Button isSecondary type="submit">
						{ __( 'Embed', 'jetpack' ) }
					</Button>
				</form>
				<div className="components-placeholder__learn-more">
					<ExternalLink href={ __( 'https://wordpress.org/support/article/embeds/' ) }>
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
			onClick: () => setEditing( true ),
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
					block="jetpack/podcast-player"
					attributes={ attributes }
					EmptyResponsePlaceholder={ handleSSRError }
					ErrorResponsePlaceholder={ handleSSRError }
				/>
			</Disabled>
		</>
	);
};

export default PodcastPlayerEdit;
