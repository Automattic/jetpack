import { BlockControls, InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import { Button, withNotices } from '@wordpress/components';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { getValidatedAttributes } from '../../shared/get-validated-attributes';
import testEmbedUrl from '../../shared/test-embed-url';
import metadata from './block.json';
import { EVENTBRITE_EXAMPLE_URL, URL_REGEX } from './constants';
import { ToolbarControls, InspectorControls } from './controls';
import EmbedForm from './form';
import Loader from './loader';
import InlinePreview from './preview';
import { convertToLink, eventIdFromUrl, normalizeUrlInput } from './utils';

import './editor.scss';

const innerButtonBlock = {
	name: 'jetpack/button',
	attributes: {
		element: 'a',
		text: _x( 'Register', 'verb: e.g. register for an event.', 'jetpack' ),
		uniqueId: 'eventbrite-widget-id',
	},
};

export const EventbriteEdit = props => {
	const { attributes, noticeOperations, onReplace, setAttributes } = props;
	const { url, style } = attributes;

	const blockProps = useBlockProps();
	const [ editingUrl, setEditingUrl ] = useState( false );
	const [ editedUrl, setEditedUrl ] = useState( attributes.url || '' );
	const [ isResolvingUrl, setIsResolvingUrl ] = useState( false );

	const cannotEmbed = ! isResolvingUrl && url && ! URL_REGEX.test( url );

	const setErrorNotice = useCallback( () => {
		noticeOperations.removeAllNotices();
		noticeOperations.createErrorNotice(
			<>
				{ __( 'Sorry, this content could not be embedded.', 'jetpack' ) }{ ' ' }
				<Button variant="link" onClick={ () => convertToLink( editedUrl, onReplace ) }>
					{ _x( 'Convert block to link', 'button label', 'jetpack' ) }
				</Button>
			</>
		);
	}, [ noticeOperations, onReplace, editedUrl ] );

	const setUrl = useCallback(
		str => {
			if ( ! str || EVENTBRITE_EXAMPLE_URL === str || 'modal' === style ) {
				return;
			}

			const eventId = eventIdFromUrl( str );

			if ( ! eventId ) {
				setErrorNotice();
			} else {
				const newAttributes = {
					eventId,
					url: str,
				};

				testEmbedUrl( newAttributes.url, setIsResolvingUrl )
					.then( resolvedUrl => {
						const newValidatedAttributes = getValidatedAttributes( metadata.attributes, {
							...newAttributes,
							url: resolvedUrl,
						} );
						setAttributes( newValidatedAttributes );
						setEditedUrl( resolvedUrl );
						noticeOperations.removeAllNotices();
					} )
					.catch( () => {
						setAttributes( { eventId: undefined, url: undefined } );
						setErrorNotice();
					} );
			}
		},
		[ style, noticeOperations, setErrorNotice, setAttributes, setEditedUrl, setIsResolvingUrl ]
	);

	useEffect( () => {
		setUrl( url );
	}, [ url, setUrl ] );

	let content;

	if ( isResolvingUrl ) {
		content = <Loader />;
	} else if ( editingUrl || ! url || cannotEmbed ) {
		content = (
			<EmbedForm
				{ ...props }
				editedUrl={ editedUrl }
				onChange={ e => setEditedUrl( e.target.value ) }
				onSubmit={ e => {
					if ( e ) {
						e.preventDefault();
					}

					setUrl( normalizeUrlInput( editedUrl ) );
					setEditingUrl( false );
				} }
			/>
		);
	} else {
		content = (
			<>
				<InspectorControls { ...props } />
				<BlockControls>
					<ToolbarControls setEditingUrl={ setEditingUrl } />
				</BlockControls>
				{ style === 'modal' ? (
					<InnerBlocks
						template={ [ [ innerButtonBlock.name, innerButtonBlock.attributes ] ] }
						templateLock="all"
					/>
				) : (
					<InlinePreview { ...props } />
				) }
			</>
		);
	}

	return <div { ...blockProps }>{ content }</div>;
};

export default withNotices( EventbriteEdit );
