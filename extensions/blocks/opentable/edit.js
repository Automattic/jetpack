/**
 * External dependencies
 */
import classnames from 'classnames';
import { isEmpty, isEqual, join } from 'lodash';

/**
 * WordPress dependencies
 */
import { BlockControls, BlockIcon, InspectorControls } from '@wordpress/block-editor';
import {
	Button,
	ExternalLink,
	Notice,
	PanelBody,
	Placeholder,
	SelectControl,
	TextareaControl,
	ToggleControl,
	Toolbar,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { _x, __ } from '@wordpress/i18n';
import { ENTER, SPACE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import './editor.scss';
import icon from './icon';
import RestaurantPicker from './restaurant-picker';

import {
	getStyleOptions,
	getStyleValues,
	languageOptions,
	languageValues,
	defaultAttributes,
	getValidatedAttributes,
} from './attributes';

const EmbedCodeForm = ( { onSubmit } ) => {
	const [ embedCode, setEmbedCode ] = useState( '' );

	return (
		<form onSubmit={ () => onSubmit( embedCode ) }>
			<TextareaControl
				onChange={ value => setEmbedCode( value ) }
				placeholder={ __( 'Paste your OpenTable embed code here…', 'jetpack' ) }
			>
				{ embedCode }
			</TextareaControl>
			<div>
				<Button isLarge type="submit">
					{ _x( 'Embed', 'button label', 'jetpack' ) }
				</Button>
			</div>
		</form>
	);
};

export default function OpentableEdit( { attributes, setAttributes, className, clientId } ) {
	const validatedAttributes = getValidatedAttributes( defaultAttributes, attributes );

	if ( ! isEqual( validatedAttributes, attributes ) ) {
		setAttributes( validatedAttributes );
	}

	const { rid, style, iframe, domain, lang, newtab } = attributes;
	const [ notice, setNotice ] = useState();

	const setErrorNotice = () =>
		setNotice(
			<>
				<strong>{ __( 'We ran into an issue', 'jetpack' ) }</strong>
				<br />
				{ __( 'Please ensure this embed matches the one from your OpenTable account', 'jetpack' ) }
			</>
		);

	const parseEmbedCode = embedCode => {
		if ( ! embedCode ) {
			setErrorNotice();
			return;
		}

		const scriptTagAttributes = embedCode.match( /< *script[^>]*src *= *["']?([^"']*)/i );
		if ( ! scriptTagAttributes || ! scriptTagAttributes[ 1 ] ) {
			setErrorNotice();
			return;
		}

		let src = '';
		if ( scriptTagAttributes[ 1 ].indexOf( 'http' ) === 0 ) {
			src = new URL( scriptTagAttributes[ 1 ] );
		} else {
			src = new URL( 'http:' + scriptTagAttributes[ 1 ] );
		}

		if ( ! src.search ) {
			setErrorNotice();
			return;
		}

		const searchParams = new URLSearchParams( src.search );
		let styleSetting = searchParams.get( 'theme' );
		if ( searchParams.get( 'type' ) === 'button' ) {
			styleSetting = searchParams.get( 'type' );
		}

		const newAttributes = {
			rid: searchParams.getAll( 'rid' ),
			iframe: Boolean( searchParams.get( 'iframe' ) ),
			domain: searchParams.get( 'domain' ),
			lang: searchParams.get( 'lang' ),
			newtab: Boolean( searchParams.get( 'newtab' ) ),
			style: styleSetting,
		};

		const validatedNewAttributes = getValidatedAttributes( defaultAttributes, newAttributes );
		setAttributes( validatedNewAttributes );
	};

	const styleOptions = getStyleOptions( rid );
	const styleValues = getStyleValues( rid );

	const updateStyle = newStyle => {
		setAttributes( { style: newStyle } );
	};

	const getTypeAndTheme = fromStyle =>
		rid.length > 1
			? [ 'multi', 'button' !== fromStyle ? fromStyle : 'standard' ]
			: [
					'button' === fromStyle ? 'button' : 'standard',
					'button' === fromStyle ? 'standard' : fromStyle,
			  ];

	const blockPreview = styleOveride => {
		const [ type, theme ] = getTypeAndTheme( styleOveride ? styleOveride : style );
		return (
			<>
				<div className={ `${ className }-overlay` }></div>
				<iframe
					title={ `Open Table Preview ${ clientId }` }
					src={ `https://www.opentable.com/widget/reservation/canvas?rid=${ join(
						rid,
						'%2C'
					) }&type=${ type }&theme=${ theme }&overlay=false&domain=${ domain }&lang=${
						lang && languageValues.includes( lang ) ? lang : 'en-US'
					}&newtab=${ newtab }&disablega=true` }
				/>
			</>
		);
	};

	const blockControls = (
		<BlockControls>
			{ ! isEmpty( rid ) && (
				<Toolbar
					isCollapsed={ true }
					icon="edit"
					label={ __( 'Type', 'jetpck' ) }
					controls={ styleOptions.map( styleOption => ( {
						title: styleOption.label,
						isActive: styleOption.value === style,
						onClick: () => updateStyle( styleOption.value ),
					} ) ) }
				/>
			) }
		</BlockControls>
	);

	const onPickerSubmit = input => {
		if ( Array.isArray( input ) ) {
			setAttributes( {
				rid: input,
				style: input.length > 1 && 'button' === style ? 'standard' : style,
			} );
		} else {
			parseEmbedCode( input );
		}
	};

	const restaurantPicker = ( pickerProps = {} ) => (
		<RestaurantPicker rids={ rid } { ...pickerProps } />
	);

	const inspectorControls = () => (
		<InspectorControls>
			<PanelBody title={ __( 'Styles', 'jetpack' ) }>
				<div className="block-editor-block-styles">
					{ styleOptions.map( styleOption => {
						return (
							<div
								key={ styleOption.value }
								className={ classnames( 'block-editor-block-styles__item is-opentable', {
									'is-active': styleOption.value === style,
								} ) }
								onClick={ () => updateStyle( styleOption.value ) }
								onKeyDown={ event => {
									if ( ENTER === event.keyCode || SPACE === event.keyCode ) {
										event.preventDefault();
										updateStyle( styleOption.value );
									}
								} }
								role="button"
								tabIndex="0"
								aria-label={ styleOption.label }
							>
								<div className="block-editor-block-styles__item-preview is-opentable">
									{ blockPreview( styleOption.value ) }
								</div>
								<div className="block-editor-block-styles__item-label">{ styleOption.label }</div>
							</div>
						);
					} ) }
				</div>
			</PanelBody>
			<PanelBody title={ __( 'Settings', 'jetpack' ) }>
				{ restaurantPicker( { onChange: onPickerSubmit } ) }
				<SelectControl
					label={ __( 'Language', 'jetpack' ) }
					value={ lang }
					onChange={ newLang => setAttributes( { lang: newLang } ) }
					options={ languageOptions }
				/>
				<ToggleControl
					label={ __( 'Load the widget in an iFrame (Recommended)', 'jetpack' ) }
					checked={ iframe }
					onChange={ () => setAttributes( { iframe: ! iframe } ) }
				/>
				<ToggleControl
					label={ __( 'Open in a new window', 'jetpack' ) }
					checked={ newtab }
					onChange={ () => setAttributes( { newtab: ! newtab } ) }
				/>
			</PanelBody>
			<PanelBody title={ __( 'Embed code', 'jetpack' ) } initialOpen={ false }>
				<EmbedCodeForm onSubmit={ parseEmbedCode } />
			</PanelBody>
		</InspectorControls>
	);

	const blockPlaceholder = (
		<Placeholder
			label={ __( 'OpenTable Reservation', 'jetpack' ) }
			icon={ <BlockIcon icon={ icon } /> }
			notices={
				notice && (
					<Notice status="error" isDismissible={ false }>
						{ notice }
					</Notice>
				)
			}
		>
			{ restaurantPicker( {
				label: __( 'Enter your restaurant name, OpenTable Restaurant ID or embed code', 'jetpack' ),
				onSubmit: onPickerSubmit,
			} ) }
			<div className={ `${ className }-placeholder-links` }>
				<ExternalLink
					href="https://en.support.wordpress.com/widgets/open-table-widget/"
					target="_blank"
				>
					{ __( 'Sign up for OpenTable', 'jetpack' ) }
				</ExternalLink>
				<ExternalLink
					href="https://en.support.wordpress.com/widgets/open-table-widget/"
					target="_blank"
				>
					{ __( 'Learn more', 'jetpack' ) }
				</ExternalLink>
			</div>
		</Placeholder>
	);
	const editClasses = classnames( className, {
		[ `${ className }-theme-${ style }` ]: ! isEmpty( rid ) && styleValues.includes( style ),
		'is-multi': 'multi' === getTypeAndTheme( style )[ 0 ],
	} );

	return (
		<div className={ editClasses }>
			{ ! isEmpty( rid ) && (
				<>
					{ inspectorControls() }
					{ blockControls }
				</>
			) }
			{ ! isEmpty( rid ) ? blockPreview() : blockPlaceholder }
		</div>
	);
}
