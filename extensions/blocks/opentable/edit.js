/**
 * External dependencies
 */
import 'url-polyfill';
import classnames from 'classnames';
import { isEmpty, isEqual, join } from 'lodash';

/**
 * WordPress dependencies
 */
import { BlockIcon, InspectorControls, InspectorAdvancedControls } from '@wordpress/block-editor';
import {
	ExternalLink,
	PanelBody,
	Placeholder,
	SelectControl,
	ToggleControl,
	withNotices,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { getBlockDefaultClassName, registerBlockStyle, unregisterBlockStyle } from '@wordpress/blocks';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './editor.scss';
import icon from './icon';
import { isAtomicSite, isSimpleSite } from '../../shared/site-type-utils';
import RestaurantPicker from './restaurant-picker';
import usePrevious from './use-previous';

import {
	buttonStyle,
	defaultAttributes,
	getStyleOptions,
	getStyleValues,
	languageOptions,
	languageValues,
} from './attributes';
import { getValidatedAttributes } from '../../shared/get-validated-attributes';
import { getActiveStyleName } from '../../shared/block-styles';
import { getAttributesFromEmbedCode } from './utils';

function OpenTableEdit( {
	attributes,
	className,
	clientId,
	isSelected,
	name,
	noticeOperations,
	noticeUI,
	setAttributes,
} ) {
	const defaultClassName = getBlockDefaultClassName( name );
	const validatedAttributes = getValidatedAttributes( defaultAttributes, attributes );

	if ( ! isEqual( validatedAttributes, attributes ) ) {
		setAttributes( validatedAttributes );
	}

	const { align, rid, iframe, domain, lang, newtab, negativeMargin } = attributes;
	const isPlaceholder = isEmpty( rid );
	const selectedStyle = getActiveStyleName( getStyleOptions(), attributes.className );
	const style = getActiveStyleName( getStyleOptions( rid ), attributes.className );
	const prevStyle = usePrevious( style );
	const __isBlockPreview = isEqual( rid, [ '1' ] );

	useEffect( () => {
		noticeOperations.removeAllNotices();
		if (
			! isPlaceholder &&
			! __isBlockPreview &&
			'wide' === style &&
			'wide' !== align &&
			'full' !== align
		) {
			const content = (
				<>
					{ __(
						'With the OpenTable block you may encounter display issues if you use its "wide" style with anything other than "wide" or "full" alignment. The wide display style may also not work well on smaller screens.',
						'jetpack'
					) }
				</>
			);
			noticeOperations.createNotice( { status: 'warning', content } );
		}
	}, [ __isBlockPreview, align, isPlaceholder, noticeOperations, rid, style ] );

	// Don't allow button style with multiple restaurant IDs.
	useEffect( () => {
		if ( 'button' === selectedStyle && Array.isArray( rid ) && rid.length > 1 ) {
			setAttributes( { className: '', style: '' } );
		}
	}, [ rid, selectedStyle, setAttributes ] );

	// Temporarily remove button block style if multiple restaurants are present.
	useEffect( () => {
		if ( ! isSelected ) {
			return;
		}

		if ( Array.isArray( rid ) && rid.length > 1 ) {
			unregisterBlockStyle( 'jetpack/opentable', [ 'button' ] );
		} else {
			registerBlockStyle( 'jetpack/opentable', buttonStyle );
		}
	}, [ isSelected, rid ] );

	useEffect( () => {
		// Reset wide alignment if switching from wide style.
		if ( 'wide' === prevStyle && 'wide' === align ) {
			setAttributes( { align: '' } );
		}

		// If switching to wide style set wide alignment as well as it works better.
		if ( 'wide' === style && prevStyle && style !== prevStyle ) {
			setAttributes( { align: 'wide' } );
		}

		// Need to force attribute to be updated after switch to using block styles
		// so it still meets frontend rendering expectations.
		setAttributes( { style } );
	}, [ style ] );

	const parseEmbedCode = embedCode => {
		const newAttributes = getAttributesFromEmbedCode( embedCode );
		if ( ! newAttributes ) {
			noticeOperations.removeAllNotices();
			noticeOperations.createErrorNotice(
				<>
					<strong>{ __( 'We ran into an issue', 'jetpack' ) }</strong>
					<br />
					{ __(
						'Please ensure this embed matches the one from your OpenTable account',
						'jetpack'
					) }
				</>
			);
		}

		const validatedNewAttributes = getValidatedAttributes( defaultAttributes, newAttributes );
		setAttributes( validatedNewAttributes );
		noticeOperations.removeAllNotices();
	};

	const styleValues = getStyleValues( rid );
	const getTypeAndTheme = fromStyle =>
		rid.length > 1
			? [ 'multi', 'button' !== fromStyle ? fromStyle : 'standard' ]
			: [
					'button' === fromStyle ? 'button' : 'standard',
					'button' === fromStyle ? 'standard' : fromStyle,
			  ];

	const blockPreview = styleOverride => {
		const [ type, theme ] = getTypeAndTheme( styleOverride ? styleOverride : style );
		return (
			<>
				<div className={ `${ defaultClassName }-overlay` }></div>
				<iframe
					title={ sprintf(
						/* translators: Placeholder is a unique ID. */
						__( 'Open Table Preview %s', 'jetpack' ),
						clientId
					) }
					scrolling="no"
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

	const inspectorControls = (
		<>
			<InspectorAdvancedControls>
				<ToggleControl
					label={ __( 'Load the widget in an iFrame (Recommended)', 'jetpack' ) }
					checked={ iframe }
					onChange={ () => setAttributes( { iframe: ! iframe } ) }
					className="is-opentable"
				/>
				{ 'button' === style && (
					<ToggleControl
						label={ __( 'Remove button margin', 'jetpack' ) }
						checked={ negativeMargin }
						onChange={ () => setAttributes( { negativeMargin: ! negativeMargin } ) }
					/>
				) }
			</InspectorAdvancedControls>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'jetpack' ) }>
					<RestaurantPicker rids={ rid } onChange={ onPickerSubmit } />
					<SelectControl
						label={ __( 'Language', 'jetpack' ) }
						value={ lang }
						onChange={ newLang => setAttributes( { lang: newLang } ) }
						options={ languageOptions }
					/>
					<ToggleControl
						label={ __( 'Open in a new window', 'jetpack' ) }
						checked={ newtab }
						onChange={ () => setAttributes( { newtab: ! newtab } ) }
					/>
				</PanelBody>
			</InspectorControls>
		</>
	);

	const supportLink =
		isSimpleSite() || isAtomicSite()
			? 'https://en.support.wordpress.com/wordpress-editor/blocks/opentable-block/'
			: 'https://jetpack.com/support/jetpack-blocks/opentable-block/';

	const blockPlaceholder = (
		<Placeholder
			label={ __( 'OpenTable Reservation', 'jetpack' ) }
			icon={ <BlockIcon icon={ icon } /> }
			instructions={ __(
				'Enter your restaurant name, or paste an OpenTable Reservation Widget embed code.',
				'jetpack'
			) }
			notices={ noticeUI }
		>
			<RestaurantPicker rids={ rid } onSubmit={ onPickerSubmit } />
			<div className={ `${ defaultClassName }-placeholder-links` }>
				<ExternalLink href="https://restaurant.opentable.com/get-started/">
					{ __( 'Sign up for OpenTable', 'jetpack' ) }
				</ExternalLink>
				<ExternalLink href={ supportLink }>{ __( 'Learn more', 'jetpack' ) }</ExternalLink>
			</div>
		</Placeholder>
	);

	const editClasses = classnames( className, {
		[ `is-style-${ style }` ]: ! isPlaceholder && styleValues.includes( style ) && className.indexOf( 'is-style' ) === -1,
		'is-placeholder': isPlaceholder,
		'is-multi': 'multi' === getTypeAndTheme( style )[ 0 ],
		[ `align${ align }` ]: align,
		'has-no-margin': negativeMargin,
	} );

	return (
		<>
			{ noticeUI }
			<div className={ editClasses }>
				{ ! isPlaceholder && inspectorControls }
				{ ! isPlaceholder ? blockPreview() : blockPlaceholder }
			</div>
		</>
	);
}

export default withNotices( OpenTableEdit );
