/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	InspectorControls,
	RichText,
	__experimentalUseGradient as useGradient,
	withColors,
} from '@wordpress/block-editor';
import { compose } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import applyFallbackStyles from './apply-fallback-styles';
import ButtonBorderPanel from './button-border-panel';
import ButtonColorsPanel from './button-colors-panel';
import { IS_GRADIENT_AVAILABLE } from './constants';
import usePassthroughAttributes from './use-passthrough-attributes';
import './editor.scss';

function ButtonEdit( {
	attributes,
	backgroundColor,
	className,
	clientId,
	fallbackBackgroundColor,
	fallbackTextColor,
	setAttributes,
	setBackgroundColor,
	setTextColor,
	textColor,
} ) {
	const { borderRadius, element, placeholder, text } = attributes;

	usePassthroughAttributes( { attributes, clientId, setAttributes } );

	const onChange = value => {
		// TODO: Remove `replace` once minimum Gutenberg version is 8.0 (to fully support `disableLineBreaks`)
		const newValue = 'input' === element ? value.replace( /<br>/gim, ' ' ) : value;
		setAttributes( { text: newValue } );
	};

	/* eslint-disable react-hooks/rules-of-hooks */
	const {
		gradientClass: gradientClass,
		gradientValue: gradientValue,
		setGradient: setGradient,
	} = IS_GRADIENT_AVAILABLE
		? useGradient( {
				gradientAttribute: 'gradient',
				customGradientAttribute: 'customGradient',
		  } )
		: {};
	/* eslint-enable react-hooks/rules-of-hooks */

	const blockClasses = classnames( 'wp-block-button', className );

	const buttonClasses = classnames( 'wp-block-button__link', {
		'has-background': backgroundColor.color || gradientValue,
		[ backgroundColor.class ]: ! gradientValue && backgroundColor.class,
		'has-text-color': textColor.color,
		[ textColor.class ]: textColor.class,
		[ gradientClass ]: gradientClass,
		'no-border-radius': 0 === borderRadius,
	} );

	const buttonStyles = {
		...( ! backgroundColor.color && gradientValue
			? { background: gradientValue }
			: { backgroundColor: backgroundColor.color } ),
		color: textColor.color,
		borderRadius: borderRadius ? borderRadius + 'px' : undefined,
	};

	return (
		<div className={ blockClasses }>
			<RichText
				allowedFormats={ [] }
				className={ buttonClasses }
				disableLineBreaks={ 'input' === element }
				onChange={ onChange }
				placeholder={ placeholder || __( 'Add text…', 'jetpack' ) }
				style={ buttonStyles }
				value={ text }
				withoutInteractiveFormatting
			/>
			<InspectorControls>
				<ButtonColorsPanel
					{ ...{
						backgroundColor,
						fallbackBackgroundColor,
						fallbackTextColor,
						gradientValue,
						setBackgroundColor,
						setGradient,
						setTextColor,
						textColor,
					} }
				/>
				<ButtonBorderPanel borderRadius={ borderRadius } setAttributes={ setAttributes } />
			</InspectorControls>
		</div>
	);
}

export default compose(
	withColors( { backgroundColor: 'background-color' }, { textColor: 'color' } ),
	applyFallbackStyles
)( ButtonEdit );
