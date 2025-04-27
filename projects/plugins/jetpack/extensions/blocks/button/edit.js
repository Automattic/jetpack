import {
	InspectorControls,
	RichText,
	__experimentalUseGradient as useGradient, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalUseBorderProps as useBorderProps, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	withColors,
	useBlockProps,
} from '@wordpress/block-editor';
import { compose } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { IS_GRADIENT_AVAILABLE } from './constants';
import ButtonControls from './controls';
import useFallbackColors from './use-fallback-colors';
import usePassthroughAttributes from './use-passthrough-attributes';
import './editor.scss';

export function ButtonEdit( props ) {
	const { attributes, backgroundColor, className, clientId, setAttributes, textColor } = props;
	const { borderRadius, element, placeholder, text, width, fontSize } = attributes;
	usePassthroughAttributes( { attributes, clientId, setAttributes } );

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

	const blockProps = useBlockProps( {
		className: clsx( 'wp-block-button', className ),
		style: { width },
	} );

	const [ fallbackColors, textRef ] = useFallbackColors();

	const borderProps = useBorderProps( attributes );

	const buttonClasses = clsx( 'wp-block-button__link', borderProps.className, {
		'has-background': backgroundColor.color || gradientValue,
		[ backgroundColor.class ]: ! gradientValue && backgroundColor.class,
		'has-text-color': textColor.color,
		[ textColor.class ]: textColor.class,
		[ gradientClass ]: gradientClass,
		'no-border-radius': 0 === borderRadius,
		[ `has-${ fontSize }-font-size` ]: !! fontSize,
		'has-custom-font-size': !! fontSize,
	} );

	const buttonStyles = {
		...( ! backgroundColor.color && gradientValue
			? { background: gradientValue }
			: { backgroundColor: backgroundColor.color } ),
		fontSize: attributes.style?.typography?.fontSize,
		color: textColor.color,
		borderRadius: borderRadius ? borderRadius + 'px' : undefined,
		...borderProps.style,
	};

	return (
		<div { ...blockProps }>
			<RichText
				allowedFormats={ 'input' === element ? [] : undefined }
				className={ buttonClasses }
				disableLineBreaks={ 'input' === element }
				onChange={ value => setAttributes( { text: value } ) }
				placeholder={ placeholder || __( 'Add text…', 'jetpack' ) }
				ref={ textRef }
				style={ buttonStyles }
				value={ text }
				withoutInteractiveFormatting
			/>
			<InspectorControls>
				<ButtonControls
					{ ...{
						gradientValue,
						setGradient,
						isGradientAvailable: IS_GRADIENT_AVAILABLE,
						...fallbackColors,
						...props,
					} }
				/>
			</InspectorControls>
		</div>
	);
}

export default compose(
	withColors( { backgroundColor: 'background-color' }, { textColor: 'color' } )
)( ButtonEdit );
