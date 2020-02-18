/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
import { Component, Fragment } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import { withFallbackStyles } from '@wordpress/components';
import {
	InspectorControls,
	PanelColorSettings,
	ContrastChecker,
	RichText,
	withColors,
	getColorClassName,
} from '@wordpress/block-editor';
import { isEqual, pick } from 'lodash';

const { getComputedStyle } = window;

const applyFallbackStyles = withFallbackStyles( ( node, ownProps ) => {
	const { textButtonColor, backgroundButtonColor } = ownProps;
	const backgroundColorValue = backgroundButtonColor && backgroundButtonColor.color;
	const textColorValue = textButtonColor && textButtonColor.color;
	//avoid the use of querySelector if textColor color is known and verify if node is available.

	let textNode;
	let button;

	if ( ! textColorValue && node ) {
		textNode = node.querySelector( '[contenteditable="true"]' );
	}

	if ( node.querySelector( '.wp-block-button__link' ) ) {
		button = node.querySelector( '.wp-block-button__link' );
	} else {
		button = node;
	}

	let fallbackBackgroundColor;
	let fallbackTextColor;

	if ( node ) {
		fallbackBackgroundColor = getComputedStyle( button ).backgroundColor;
	}

	if ( textNode ) {
		fallbackTextColor = getComputedStyle( textNode ).color;
	}

	return {
		fallbackBackgroundColor: backgroundColorValue || fallbackBackgroundColor,
		fallbackTextColor: textColorValue || fallbackTextColor,
	};
} );

const getButtonClasses = ( { textButtonColor, backgroundButtonColor } ) => {
	const textClass = getColorClassName( 'color', textButtonColor );
	const backgroundClass = getColorClassName( 'background-color', backgroundButtonColor );
	return classnames( 'wp-block-button__link', {
		'has-text-color': textButtonColor,
		[ textClass ]: textClass,
		'has-background': backgroundButtonColor,
		[ backgroundClass ]: backgroundClass,
	} );
};

export function SubmitButtonSave( { className, attributes } ) {
	const {
		submitButtonText,
		backgroundButtonColor,
		textButtonColor,
		customBackgroundButtonColor,
		customTextButtonColor,
		url,
	} = attributes;

	const buttonStyle = {
		backgroundColor: backgroundButtonColor ? undefined : customBackgroundButtonColor,
		color: textButtonColor ? undefined : customTextButtonColor,
	};

	const buttonClasses = getButtonClasses( { textButtonColor, backgroundButtonColor } );
	return (
		<div className={ classnames( 'wp-block-button', 'jetpack-submit-button', className ) }>
			<RichText.Content
				className={ buttonClasses }
				href={ url }
				data-id-attr="placeholder"
				rel="noopener noreferrer"
				role="button"
				style={ buttonStyle }
				tagName="a"
				target="_blank"
				value={ submitButtonText }
			/>
		</div>
	);
}

class SubmitButton extends Component {
	componentDidUpdate( prevProps ) {
		if (
			! isEqual( this.props.attributes.textButtonColor, prevProps.attributes.textButtonColor ) ||
			! isEqual(
				this.props.attributes.backgroundButtonColor,
				prevProps.attributes.backgroundButtonColor
			)
		) {
			const buttonClasses = getButtonClasses(
				pick( this.props.attributes, [ 'textButtonColor', 'backgroundButtonColor' ] )
			);
			this.props.setAttributes( { submitButtonClasses: buttonClasses } );
		}
	}
	render() {
		const {
			attributes,
			backgroundButtonColor,
			textButtonColor,
			fallbackBackgroundColor,
			fallbackTextColor,
			setAttributes,
			setBackgroundButtonColor,
			setTextButtonColor,
		} = this.props;

		const backgroundColor = attributes.customBackgroundButtonColor || fallbackBackgroundColor;
		const color = attributes.customTextButtonColor || fallbackTextColor;
		const buttonStyle = { border: 'none', backgroundColor, color };
		const buttonClasses = getButtonClasses(
			pick( this.attributes, [ 'backgroundButtonColor', 'textButtonColor' ] )
		);

		return (
			<Fragment>
				<div className="wp-block-button jetpack-submit-button">
					<RichText
						placeholder={ __( 'Add text…', 'jetpack' ) }
						value={ attributes.submitButtonText }
						onChange={ nextValue => setAttributes( { submitButtonText: nextValue } ) }
						className={ buttonClasses }
						style={ buttonStyle }
						keepPlaceholderOnFocus
						allowedFormats={ [] }
					/>
				</div>
				<InspectorControls>
					<PanelColorSettings
						title={ __( 'Button Color Settings', 'jetpack' ) }
						colorSettings={ [
							{
								value: backgroundColor,
								onChange: setBackgroundButtonColor,
								label: __( 'Background Color', 'jetpack' ),
							},
							{
								value: color,
								onChange: setTextButtonColor,
								label: __( 'Text Color', 'jetpack' ),
							},
						] }
					/>
					<ContrastChecker
						textColor={ color }
						backgroundColor={ backgroundColor }
						fallbackBackgroundColor
						fallbackTextColor
					/>
				</InspectorControls>
			</Fragment>
		);
	}
}

export default compose( [
	withColors( { backgroundButtonColor: 'background-color' }, { textButtonColor: 'color' } ),
	applyFallbackStyles,
] )( SubmitButton );
