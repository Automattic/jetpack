import type { EditBlockProps } from '../common/block.ts';
import type { JSX } from 'react';

const React = window.React;
const {
	__experimentalUseMultipleOriginColorsAndGradients: useMultipleOriginColorsAndGradients,
	__experimentalColorGradientSettingsDropdown: ColorGradientSettingsDropdown,
} = window.wp.blockEditor;
const { __ } = window.wp.i18n;

/**
 *
 * @param props
 */
export function ColorTools( props: EditBlockProps ): JSX.Element | null {
	// Turn on contrast checker for web only since it's not supported on mobile yet.
	const colorGradientSettings = useMultipleOriginColorsAndGradients();

	const settings = React.useMemo(
		() => [
			{
				colorValue: props.attributes.colorComment,
				/* translators: This is the syntax highlighting color for "comment" tokens. */
				label: __( 'Syntax: Comment', 'jetpack-mu-wpcom' ),
				onColorChange: ( value: string ) => props.setAttributes( { colorComment: value } ),
				resetAllFilter: () => props.setAttributes( { colorComment: undefined } ),
				clearable: true,
				enableAlpha: true,
			},
			{
				colorValue: props.attributes.colorKeyword,
				/* translators: This is the syntax highlighting color for "keyword" tokens. */
				label: __( 'Syntax: Keyword', 'jetpack-mu-wpcom' ),
				onColorChange: ( value: string ) => props.setAttributes( { colorKeyword: value } ),
				resetAllFilter: () => props.setAttributes( { colorKeyword: undefined } ),
				clearable: true,
				enableAlpha: true,
			},
			{
				colorValue: props.attributes.colorBoolean,
				/* translators: This is the syntax highlighting color for "boolean" tokens. */
				label: __( 'Syntax: Boolean', 'jetpack-mu-wpcom' ),
				onColorChange: ( value: string ) => props.setAttributes( { colorBoolean: value } ),
				resetAllFilter: () => props.setAttributes( { colorBoolean: undefined } ),
				clearable: true,
				enableAlpha: true,
			},
			{
				colorValue: props.attributes.colorLiteral,
				/* translators: This is the syntax highlighting color for "literal" tokens. */
				label: __( 'Syntax: Literal', 'jetpack-mu-wpcom' ),
				onColorChange: ( value: string ) => props.setAttributes( { colorLiteral: value } ),
				resetAllFilter: () => props.setAttributes( { colorLiteral: undefined } ),
				clearable: true,
				enableAlpha: true,
			},
			{
				colorValue: props.attributes.colorString,
				/* translators: This is the syntax highlighting color for "string" tokens. */
				label: __( 'Syntax: String', 'jetpack-mu-wpcom' ),
				onColorChange: ( value: string ) => props.setAttributes( { colorString: value } ),
				resetAllFilter: () => props.setAttributes( { colorString: undefined } ),
				clearable: true,
				enableAlpha: true,
			},
			{
				colorValue: props.attributes.colorSpecialString,
				/* translators: This is the syntax highlighting color for "special string" tokens. */
				label: __( 'Syntax: Special string', 'jetpack-mu-wpcom' ),
				onColorChange: ( value: string ) => props.setAttributes( { colorSpecialString: value } ),
				resetAllFilter: () => props.setAttributes( { colorSpecialString: undefined } ),
				clearable: true,
				enableAlpha: true,
			},
			{
				colorValue: props.attributes.colorMacroName,
				/* translators: This is the syntax highlighting color for "macro name" tokens. */
				label: __( 'Syntax: Macro name', 'jetpack-mu-wpcom' ),
				onColorChange: ( value: string ) => props.setAttributes( { colorMacroName: value } ),
				resetAllFilter: () => props.setAttributes( { colorMacroName: undefined } ),
				clearable: true,
				enableAlpha: true,
			},
			{
				colorValue: props.attributes.colorVariableDefinition,
				/* translators: This is the syntax highlighting color for "variable definition" tokens. */
				label: __( 'Syntax: Variable definition', 'jetpack-mu-wpcom' ),
				onColorChange: ( value: string ) =>
					props.setAttributes( { colorVariableDefinition: value } ),
				resetAllFilter: () => props.setAttributes( { colorVariableDefinition: undefined } ),
				clearable: true,
				enableAlpha: true,
			},
			{
				colorValue: props.attributes.colorTypeName,
				/* translators: This is the syntax highlighting color for "type name" tokens. */
				label: __( 'Syntax: Type name', 'jetpack-mu-wpcom' ),
				onColorChange: ( value: string ) => props.setAttributes( { colorTypeName: value } ),
				resetAllFilter: () => props.setAttributes( { colorTypeName: undefined } ),
				clearable: true,
				enableAlpha: true,
			},
			{
				colorValue: props.attributes.colorClassName,
				/* translators: This is the syntax highlighting color for "class name" tokens. */
				label: __( 'Syntax: Class name', 'jetpack-mu-wpcom' ),
				onColorChange: ( value: string ) => props.setAttributes( { colorClassName: value } ),
				resetAllFilter: () => props.setAttributes( { colorClassName: undefined } ),
				clearable: true,
				enableAlpha: true,
			},
			{
				colorValue: props.attributes.colorInvalid,
				/* translators: This is the syntax highlighting color for "invalid" tokens. */
				label: __( 'Syntax: Invalid', 'jetpack-mu-wpcom' ),
				onColorChange: ( value: string ) => props.setAttributes( { colorInvalid: value } ),
				resetAllFilter: () => props.setAttributes( { colorInvalid: undefined } ),
				clearable: true,
				enableAlpha: true,
			},
		],
		[ props.attributes ]
	);

	if ( ! colorGradientSettings.hasColorsOrGradients ) {
		return null;
	}

	return (
		<ColorGradientSettingsDropdown
			__experimentalIsRenderedInSidebar
			settings={ settings }
			panelId={ props.clientId }
			isShownByDefault={ false }
			{ ...colorGradientSettings }
			gradients={ [] }
		/>
	);
}
