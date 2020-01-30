/**
 * External Dependencies
 */
import 'url-polyfill';
import { isEqual, pick } from 'lodash';
import queryString from 'query-string';

/**
 * WordPress dependencies
 */
import { BlockIcon, InspectorControls } from '@wordpress/block-editor';
import {
	Button,
	ExternalLink,
	Notice,
	PanelBody,
	Placeholder,
	ToggleControl,
	withNotices,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { getBlockDefaultClassName } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './editor.scss';
import './view.scss';
import icon from './icon';
import attributeDetails from './attributes';
import { getValidatedAttributes } from '../../shared/get-validated-attributes';
import SubmitButton from '../../shared/submit-button';
import { getAttributesFromEmbedCode } from './utils';
import BlockStylesSelector from '../../shared/components/block-styles-selector';

function CalendlyEdit( props ) {
	const {
		attributes,
		className,
		clientId,
		name,
		noticeOperations,
		noticeUI,
		setAttributes,
	} = props;
	const defaultClassName = getBlockDefaultClassName( name );
	const validatedAttributes = getValidatedAttributes( attributeDetails, attributes );

	if ( ! isEqual( validatedAttributes, attributes ) ) {
		setAttributes( validatedAttributes );
	}

	const {
		backgroundColor,
		submitButtonText,
		hideEventTypeDetails,
		primaryColor,
		textColor,
		style,
		url,
	} = validatedAttributes;
	const [ embedCode, setEmbedCode ] = useState( '' );

	const setErrorNotice = () => {
		noticeOperations.removeAllNotices();
		noticeOperations.createErrorNotice(
			__( "Your calendar couldn't be embedded. Please double check your URL or code.", 'jetpack' )
		);
	};

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

		const newValidatedAttributes = getValidatedAttributes( attributeDetails, newAttributes );

		setAttributes( newValidatedAttributes );
		noticeOperations.removeAllNotices();
	};

	const embedCodeForm = (
		<>
			<form onSubmit={ parseEmbedCode }>
				<input
					type="text"
					id="embedCode"
					onChange={ event => setEmbedCode( event.target.value ) }
					placeholder={ __( 'Calendly web address or embed code…', 'jetpack' ) }
					value={ embedCode }
					className="components-placeholder__input"
				/>
				<div>
					<Button isSecondary isLarge type="submit">
						{ _x( 'Embed', 'button label', 'jetpack' ) }
					</Button>
				</div>
			</form>
			<div className={ `${ defaultClassName }-learn-more` }>
				<ExternalLink href="https://help.calendly.com/hc/en-us/articles/223147027-Embed-options-overview">
					{ __( 'Need help finding your embed code?', 'jetpack' ) }
				</ExternalLink>
			</div>
		</>
	);

	const blockPlaceholder = (
		<Placeholder
			label={ __( 'Calendly', 'jetpack' ) }
			instructions={ __( 'Enter your Calendly web address or embed code below.', 'jetpack' ) }
			icon={ <BlockIcon icon={ icon } /> }
			notices={ noticeUI }
		>
			{ embedCodeForm }
		</Placeholder>
	);

	const iframeSrc = () => {
		const query = queryString.stringify( {
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

	const submitButtonProps = {
		attributes: pick( validatedAttributes, [
			'submitButtonText',
			'backgroundButtonColor',
			'textButtonColor',
			'customBackgroundButtonColor',
			'customBackgroundButtonColor',
		] ),
		setAttributes,
	};
	const submitButtonPreview = <SubmitButton { ...submitButtonProps } />;

	const linkPreview = (
		<>
			<a style={ { alignSelf: 'flex-start', border: 'none' } } className="wp-block-button__link">
				{ submitButtonText }
			</a>
		</>
	);

	const blockPreview = ( previewStyle, disabled ) => {
		if ( previewStyle === 'inline' ) {
			return inlinePreview;
		}

		if ( disabled ) {
			return linkPreview;
		}

		return submitButtonPreview;
	};

	const styleOptions = [
		{ value: 'inline', label: __( 'Inline', 'jetpack' ) },
		{ value: 'link', label: __( 'Link', 'jetpack' ) },
	];

	const inspectorControls = (
		<>
			{ url && (
				<BlockStylesSelector
					clientId={ clientId }
					styleOptions={ styleOptions }
					onSelectStyle={ setAttributes }
					activeStyle={ style }
					attributes={ attributes }
					viewportWidth={ 500 }
				/>
			) }
			<InspectorControls>
				<PanelBody title={ __( 'Calendar Settings', 'jetpack' ) } initialOpen={ false }>
					<form onSubmit={ parseEmbedCode } className={ `${ defaultClassName }-embed-form-sidebar` }>
						<input
							type="text"
							id="embedCode"
							onChange={ event => setEmbedCode( event.target.value ) }
							placeholder={ __( 'Calendly web address or embed code…', 'jetpack' ) }
							value={ embedCode }
							className="components-placeholder__input"
						/>
						<div>
							<Button isSecondary isLarge type="submit">
								{ _x( 'Embed', 'button label', 'jetpack' ) }
							</Button>
						</div>
					</form>

					<ToggleControl
						label={ __( 'Hide Event Type Details', 'jetpack' ) }
						checked={ hideEventTypeDetails }
						onChange={ () => setAttributes( { hideEventTypeDetails: ! hideEventTypeDetails } ) }
					/>
				</PanelBody>
				{ url && (
					<Notice className={ `${ defaultClassName }-color-notice` } isDismissible={ false }>
						<ExternalLink href="https://help.calendly.com/hc/en-us/community/posts/360033166114-Embed-Widget-Color-Customization-Available-Now-">
							{ __( 'Follow these instructions to change the colors in this block.', 'jetpack' ) }
						</ExternalLink>
					</Notice>
				) }
			</InspectorControls>
		</>
	);

	const classes = `${ className } calendly-style-${ style }`;

	return (
		<div className={ classes }>
			{ inspectorControls }
			{ url ? blockPreview( style ) : blockPlaceholder }
		</div>
	);
}

export default withNotices( CalendlyEdit );
