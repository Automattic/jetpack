/**
 * External dependencies
 */
import { pick } from 'lodash';

/**
 * Internal dependencies
 */
import { getValidatedAttributes } from '../../get-validated-attributes';

/**
 * Given the block props, return only those needed for the ButtonEdit component.
 *
 * @param {Object} props The block props.
 * @param {Object} attributesDefinition The block attributes definition.
 * @returns {Object} The props to be used by ButtonEdit.
 */
export default function getButtonEditProps( props, attributesDefinition ) {
	const { attributes, className, setAttributes } = props;
	const validatedAttributes = getValidatedAttributes( attributesDefinition, attributes );

	const buttonAttributes = pick( validatedAttributes, [
		'buttonBackgroundColor',
		'buttonBorderRadius',
		'buttonFallbackBackgroundColor',
		'buttonFallbackTextColor',
		'buttonPlaceholder',
		'buttonText',
		'buttonTextColor',
	] );

	const buttonProps = pick( props, [
		'buttonBackgroundColor',
		'buttonFallbackBackgroundColor',
		'buttonFallbackTextColor',
		'buttonTextColor',
		'setButtonBackgroundColor',
		'setButtonTextColor',
	] );

	return {
		attributes: buttonAttributes,
		className,
		setAttributes,
		...buttonProps,
	};
}
