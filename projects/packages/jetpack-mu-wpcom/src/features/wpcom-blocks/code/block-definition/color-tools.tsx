// @ts-expect-error: No types.
import * as wpBlockEditor from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import * as React from 'react';
import type { EditBlockProps } from '../common/block.ts';

const {
	__experimentalUseMultipleOriginColorsAndGradients,
	__experimentalColorGradientSettingsDropdown: ExperimentalColorGradientSettingsDropdown,
}: Window[ 'wp' ][ 'blockEditor' ] = wpBlockEditor;

/**
 * Color Tools component for rendering additional block inspector color controls.
 *
 * @param props -- Component props.
 * @return Color tools for the block inspector controls.
 */
export function ColorTools( props: EditBlockProps ): React.JSX.Element | null {
	const { attributes, setAttributes } = props;

	const {
		colorInvalid,
		colorComment,
		colorString,
		colorBoolean,
		colorKeyword,
		colorLiteral,
		colorTypeName,
		colorClassName,
		colorMacroName,
		colorSpecialString,
		colorVariableDefinition,
	} = attributes;

	// eslint-disable-next-line @wordpress/no-unused-vars-before-return -- This is a hook and must be called unconditionally.
	const settings = React.useMemo(
		() => [
			{
				colorValue: colorComment,
				/* translators: This is the syntax highlighting color for "comment" tokens. */
				label: __( 'Syntax: Comment', 'jetpack-mu-wpcom' ),
				onColorChange: ( value: string ) => setAttributes( { colorComment: value } ),
				resetAllFilter: () => setAttributes( { colorComment: undefined } ),
				clearable: true,
				enableAlpha: true,
			},
			{
				colorValue: colorKeyword,
				/* translators: This is the syntax highlighting color for "keyword" tokens. */
				label: __( 'Syntax: Keyword', 'jetpack-mu-wpcom' ),
				onColorChange: ( value: string ) => setAttributes( { colorKeyword: value } ),
				resetAllFilter: () => setAttributes( { colorKeyword: undefined } ),
				clearable: true,
				enableAlpha: true,
			},
			{
				colorValue: colorBoolean,
				/* translators: This is the syntax highlighting color for "boolean" tokens. */
				label: __( 'Syntax: Boolean', 'jetpack-mu-wpcom' ),
				onColorChange: ( value: string ) => setAttributes( { colorBoolean: value } ),
				resetAllFilter: () => setAttributes( { colorBoolean: undefined } ),
				clearable: true,
				enableAlpha: true,
			},
			{
				colorValue: colorLiteral,
				/* translators: This is the syntax highlighting color for "literal" tokens. */
				label: __( 'Syntax: Literal', 'jetpack-mu-wpcom' ),
				onColorChange: ( value: string ) => setAttributes( { colorLiteral: value } ),
				resetAllFilter: () => setAttributes( { colorLiteral: undefined } ),
				clearable: true,
				enableAlpha: true,
			},
			{
				colorValue: colorString,
				/* translators: This is the syntax highlighting color for "string" tokens. */
				label: __( 'Syntax: String', 'jetpack-mu-wpcom' ),
				onColorChange: ( value: string ) => setAttributes( { colorString: value } ),
				resetAllFilter: () => setAttributes( { colorString: undefined } ),
				clearable: true,
				enableAlpha: true,
			},
			{
				colorValue: colorSpecialString,
				/* translators: This is the syntax highlighting color for "special string" tokens. */
				label: __( 'Syntax: Special string', 'jetpack-mu-wpcom' ),
				onColorChange: ( value: string ) => setAttributes( { colorSpecialString: value } ),
				resetAllFilter: () => setAttributes( { colorSpecialString: undefined } ),
				clearable: true,
				enableAlpha: true,
			},
			{
				colorValue: colorMacroName,
				/* translators: This is the syntax highlighting color for "macro name" tokens. */
				label: __( 'Syntax: Macro name', 'jetpack-mu-wpcom' ),
				onColorChange: ( value: string ) => setAttributes( { colorMacroName: value } ),
				resetAllFilter: () => setAttributes( { colorMacroName: undefined } ),
				clearable: true,
				enableAlpha: true,
			},
			{
				colorValue: colorVariableDefinition,
				/* translators: This is the syntax highlighting color for "variable definition" tokens. */
				label: __( 'Syntax: Variable definition', 'jetpack-mu-wpcom' ),
				onColorChange: ( value: string ) => setAttributes( { colorVariableDefinition: value } ),
				resetAllFilter: () =>
					setAttributes( {
						colorVariableDefinition: undefined,
					} ),
				clearable: true,
				enableAlpha: true,
			},
			{
				colorValue: colorTypeName,
				/* translators: This is the syntax highlighting color for "type name" tokens. */
				label: __( 'Syntax: Type name', 'jetpack-mu-wpcom' ),
				onColorChange: ( value: string ) => setAttributes( { colorTypeName: value } ),
				resetAllFilter: () => setAttributes( { colorTypeName: undefined } ),
				clearable: true,
				enableAlpha: true,
			},
			{
				colorValue: colorClassName,
				/* translators: This is the syntax highlighting color for "class name" tokens. */
				label: __( 'Syntax: Class name', 'jetpack-mu-wpcom' ),
				onColorChange: ( value: string ) => setAttributes( { colorClassName: value } ),
				resetAllFilter: () => setAttributes( { colorClassName: undefined } ),
				clearable: true,
				enableAlpha: true,
			},
			{
				colorValue: colorInvalid,
				/* translators: This is the syntax highlighting color for "invalid" tokens. */
				label: __( 'Syntax: Invalid', 'jetpack-mu-wpcom' ),
				onColorChange: ( value: string ) => setAttributes( { colorInvalid: value } ),
				resetAllFilter: () => setAttributes( { colorInvalid: undefined } ),
				clearable: true,
				enableAlpha: true,
			},
		],
		[
			colorInvalid,
			colorComment,
			colorString,
			colorBoolean,
			colorKeyword,
			colorLiteral,
			colorTypeName,
			colorClassName,
			colorMacroName,
			colorSpecialString,
			colorVariableDefinition,
			setAttributes,
		]
	);

	// Check for availability of required experimental features.
	if (
		typeof __experimentalUseMultipleOriginColorsAndGradients === 'undefined' ||
		typeof ExperimentalColorGradientSettingsDropdown === 'undefined'
	) {
		if ( ( globalThis as { SCRIPT_DEBUG?: unknown } ).SCRIPT_DEBUG ) {
			// eslint-disable-next-line no-console -- Console message in debug.
			console.warn( 'Experimental feature not available.' );
		}

		return null;
	}

	const colorGradientSettings = __experimentalUseMultipleOriginColorsAndGradients();
	if ( ! colorGradientSettings.hasColorsOrGradients ) {
		return null;
	}

	return (
		<ExperimentalColorGradientSettingsDropdown
			__experimentalIsRenderedInSidebar
			settings={ settings }
			panelId={ props.clientId }
			isShownByDefault={ false }
			{ ...colorGradientSettings }
			gradients={ [] }
		/>
	);
}
