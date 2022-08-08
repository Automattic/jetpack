import {
	InspectorControls,
	RichText,
	__experimentalUseGradient as useGradient, // eslint-disable-line wpcalypso/no-unsafe-wp-apis
	withColors,
} from '@wordpress/block-editor';
import { compose } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
import useWidth from '../../shared/use-width';
import applyFallbackStyles from './apply-fallback-styles';
import { IS_GRADIENT_AVAILABLE } from './constants';
import ButtonControls from './controls';
import usePassthroughAttributes from './use-passthrough-attributes';
import './editor.scss';

export function ButtonEdit( props ) {
	const {
		attributes,
		backgroundColor,
		className,
		clientId,
		context,
		setAttributes,
		textColor,
	} = props;
	const { borderRadius, element, placeholder, text, width } = attributes;
	const isWidthSetOnParentBlock = 'jetpack/parentBlockWidth' in context;

	usePassthroughAttributes( { attributes, clientId, setAttributes } );
	useWidth( { attributes, disableEffects: isWidthSetOnParentBlock, setAttributes } );

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
