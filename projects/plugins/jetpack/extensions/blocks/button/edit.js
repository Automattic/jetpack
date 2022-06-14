import {
	InspectorControls,
	RichText,
	__experimentalUseGradient as useGradient, // eslint-disable-line wpcalypso/no-unsafe-wp-apis
	withColors,
} from '@wordpress/block-editor';
import { compose } from '@wordpress/compose';
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
import applyFallbackStyles from './apply-fallback-styles';
import { IS_GRADIENT_AVAILABLE } from './constants';
import ButtonControls from './controls';
import usePassthroughAttributes from './use-passthrough-attributes';
import './editor.scss';

const usePrevious = value => {
	const ref = useRef();

	useEffect( () => {
		ref.current = value;
	}, [ value ] );

	return ref.current;
};

export function ButtonEdit( props ) {
	const { attributes, backgroundColor, className, clientId, setAttributes, textColor } = props;
	const { align, borderRadius, element, placeholder, text, width } = attributes;
	const previousAlign = usePrevious( align );

	usePassthroughAttributes( { attributes, clientId, setAttributes } );

	useEffect( () => {
		// Reset button width if switching to left or right (floated) alignment for first time.
		const alignmentChanged = previousAlign !== align;
		const isAlignedLeftRight = align === 'left' || align === 'right';

		if ( alignmentChanged && isAlignedLeftRight && width?.includes( '%' ) ) {
			setAttributes( { width: undefined } );
		}
	}, [ align, previousAlign, setAttributes, width ] );

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
		'has-custom-width': !! width,
	} );

	const buttonStyles = {
		...( ! backgroundColor.color && gradientValue
			? { background: gradientValue }
			: { backgroundColor: backgroundColor.color } ),
		color: textColor.color,
		borderRadius: borderRadius ? borderRadius + 'px' : undefined,
		width,
	};

	return (
		<div className={ blockClasses }>
			<RichText
				allowedFormats={ 'input' === element ? [] : undefined }
				className={ buttonClasses }
				disableLineBreaks={ 'input' === element }
				onChange={ value => setAttributes( { text: value } ) }
				placeholder={ placeholder || __( 'Add text…', 'jetpack' ) }
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
						...props,
					} }
				/>
			</InspectorControls>
		</div>
	);
}

export default compose(
	withColors( { backgroundColor: 'background-color' }, { textColor: 'color' } ),
	applyFallbackStyles
)( ButtonEdit );
