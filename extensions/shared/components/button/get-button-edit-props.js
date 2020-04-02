/**
 * External dependencies
 */
import { isEmpty, pick } from 'lodash';

/**
 * Internal dependencies
 */
import { getValidatedAttributes } from '../../get-validated-attributes';

/**
 * Given the block props, return only those needed for the ButtonEdit component.
 *
 * @param {object} props - The block props.
 * @param {object} [attributesDefinition] - The block attributes definition.
 * @returns {object} The props to be used by ButtonEdit.
 */
export default function getButtonEditProps( props, attributesDefinition = {} ) {
	const { attributes, className, setAttributes } = props;

	const validatedAttributes = isEmpty( attributesDefinition )
		? attributes
		: getValidatedAttributes( attributesDefinition, attributes );

	const buttonAttributes = pick( validatedAttributes, [
		'buttonBackgroundColor',
		'buttonBorderRadius',
		'buttonGradient',
		'buttonPlaceholder',
		'buttonText',
		'buttonTextColor',
		'buttonUrl',
		'customButtonBackgroundColor',
		'customButtonGradient',
		'customButtonTextColor',
	] );

	return {
		attributes: buttonAttributes,
		className,
		setAttributes,
	};
}
