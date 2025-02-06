import { getBlockIconComponent } from '@automattic/jetpack-shared-extension-utils';
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import { getBlockDefaultClassName } from '@wordpress/blocks';
import { Button, ExternalLink, Placeholder, Spinner, withNotices } from '@wordpress/components';
import { select, dispatch } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import clsx from 'clsx';
import { isEqual } from 'lodash';
import { getValidatedAttributes } from '../../shared/get-validated-attributes';
import testEmbedUrl from '../../shared/test-embed-url';
import metadata from './block.json';
import { CALENDLY_EXAMPLE_URL } from './constants';
import CalendlyControls from './controls';
import { getAttributesFromEmbedCode } from './utils';

import './editor.scss';
import './view.scss';

const innerButtonBlock = {
	name: 'jetpack/button',
	attributes: {
		element: 'a',
		text: __( 'Schedule time with me', 'jetpack' ),
		uniqueId: 'calendly-widget-id',
		url: CALENDLY_EXAMPLE_URL,
	},
};
const icon = getBlockIconComponent( metadata );

export function CalendlyEdit( props ) {
	const { attributes, clientId, name, noticeOperations, noticeUI, setAttributes } = props;
	const defaultClassName = getBlockDefaultClassName( name );
	const validatedAttributes = getValidatedAttributes( metadata.attributes, attributes );

	if ( ! isEqual( validatedAttributes, attributes ) ) {
		setAttributes( validatedAttributes );
	}

	const { backgroundColor, hideEventTypeDetails, primaryColor, textColor, style, url } =
		validatedAttributes;
	const [ embedCode, setEmbedCode ] = useState( url );
	const [ isEditingUrl, setIsEditingUrl ] = useState( false );
	const [ isResolvingUrl, setIsResolvingUrl ] = useState( false );
	const [ embedButtonAttributes, setEmbedButtonAttributes ] = useState( {} );
	const blockProps = useBlockProps();

	const setErrorNotice = () => {
		noticeOperations.removeAllNotices();
		noticeOperations.createErrorNotice(
			__( "Your calendar couldn't be embedded. Please double check your URL or code.", 'jetpack' )
		);
	};

	useEffect( () => {
		if ( ! url || CALENDLY_EXAMPLE_URL === url || 'link' === style ) {
			return;
		}
		testEmbedUrl( url, setIsResolvingUrl ).catch( () => {
			setAttributes( { url: undefined } );
			setErrorNotice();
		} );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	const parseEmbedCode = event => {
		if ( ! event ) {
			setErrorNotice();
			return;
		}

		event.preventDefault();

		const newAttributes = getAttributesFromEmbedCode( embedCode );
		if ( ! newAttributes ) {
			setErrorNotice();
			return;
		}

		if ( newAttributes.buttonAttributes && 'link' === newAttributes.style ) {
			const innerButtons = select( 'core/editor' ).getBlocksByClientId( clientId );

			if ( innerButtons.length ) {
				innerButtons[ 0 ].innerBlocks.forEach( block => {
					dispatch( 'core/editor' ).updateBlockAttributes(
						block.clientId,
						newAttributes.buttonAttributes
					);
				} );
			}
			setEmbedButtonAttributes( newAttributes.buttonAttributes );
		}

		testEmbedUrl( newAttributes.url, setIsResolvingUrl )
			.then( () => {
				const newValidatedAttributes = getValidatedAttributes( metadata.attributes, newAttributes );
				setAttributes( newValidatedAttributes );
				setIsEditingUrl( false );
				noticeOperations.removeAllNotices();
			} )
			.catch( () => {
				setAttributes( { url: undefined } );
				setErrorNotice();
			} );
	};

	const blockEmbedding = (
		<div className="wp-block-embed is-loading">
			<Spinner />
			<p>{ __( 'Embedding…', 'jetpack' ) }</p>
		</div>
	);

	const blockPlaceholder = (
		<Placeholder
			label={ __( 'Calendly', 'jetpack' ) }
			instructions={ __( 'Enter your Calendly web address or embed code below.', 'jetpack' ) }
			icon={ icon }
			notices={ noticeUI }
		>
			<form onSubmit={ parseEmbedCode }>
				<input
					type="text"
					id="embedCode"
					onChange={ event => setEmbedCode( event.target.value ) }
					placeholder={ __( 'Calendly web address or embed code…', 'jetpack' ) }
					value={ embedCode || '' }
					className="components-placeholder__input"
				/>
				<div>
					<Button variant="secondary" type="submit">
						{ _x( 'Embed', 'button label', 'jetpack' ) }
					</Button>
				</div>
			</form>
			<div className={ `${ defaultClassName }-learn-more` }>
				<ExternalLink href="https://help.calendly.com/hc/en-us/articles/223147027-Embed-options-overview">
					{ __( 'Need help finding your embed code?', 'jetpack' ) }
				</ExternalLink>
			</div>
		</Placeholder>
	);

	const iframeSrc = () => {
		const query = new URLSearchParams( {
			embed_domain: 'wordpress.com',
			embed_type: 'Inline',
			hide_event_type_details: hideEventTypeDetails ? 1 : 0,
			background_color: backgroundColor,
			primary_color: primaryColor,
			text_color: textColor,
		} );
		return `${ url }?${ query }`;
	};

	const inlinePreview = (
		<>
			<div className={ `${ defaultClassName }-overlay` }></div>
			<iframe
				src={ iframeSrc() }
				width="100%"
				height="100%"
				frameBorder="0"
				data-origwidth="100%"
				data-origheight="100%"
				title="Calendly"
			></iframe>
		</>
	);

	const buttonPreview = (
		<InnerBlocks
			template={ [
				[
					innerButtonBlock.name,
					{
						...innerButtonBlock.attributes,
						...embedButtonAttributes,
						passthroughAttributes: { url: 'url' },
					},
				],
			] }
			templateLock="all"
		/>
	);

	const blockPreview = previewStyle => {
		if ( previewStyle === 'inline' ) {
			return inlinePreview;
		}

		return buttonPreview;
	};

	if ( isResolvingUrl ) {
		return blockEmbedding;
	}

	return (
		<div
			{ ...blockProps }
			className={ clsx( blockProps.className, {
				[ `calendly-style-${ style }` ]: url && ! isEditingUrl,
			} ) }
		>
			<CalendlyControls
				{ ...{
					...props,
					defaultClassName,
					embedCode,
					isEditingUrl,
					parseEmbedCode,
					setEmbedCode,
					setIsEditingUrl,
				} }
			/>
			{ url && ! isEditingUrl ? blockPreview( style ) : blockPlaceholder }
		</div>
	);
}

export default withNotices( CalendlyEdit );
