import blockJson from '../common/block.json';
import {
	type Attributes,
	BLOCK_NAME,
	type EditBlockProps,
	type SaveBlockProps,
} from '../common/block.ts';
import { ColorTools } from './color-tools.tsx';
import langNames from './lang-names.json';
import { transforms } from './transforms.ts';
import type { CSSProperties } from 'react';

const React = window.React;
const { InspectorControls, useBlockProps, withColors, __experimentalGetElementClassName } =
	window.wp.blockEditor;
const { registerBlockType, registerBlockStyle } = window.wp.blocks;
const {
	ExternalLink,
	Notice,
	PanelBody,
	CustomSelectControl,
	SelectControl,
	TextControl,
	ToggleControl,
} = window.wp.components;
const { __, _x } = window.wp.i18n;

const LINE_NUMBER_START_MIN = 0;
const LINE_NUMBER_START_MAX = 10_000;

type Props = EditBlockProps | SaveBlockProps;

// This is helpful for validating the definition aligns with types, but is likely imperfect.
type AttributesConfig = {
	[ key in keyof Attributes ]:
		| {
				type: 'string';
				default?: string;
		  }
		| {
				type: 'string';
				default?: string;
				source: 'text';
				selector: string;
		  }
		| {
				type: 'boolean';
				default?: boolean;
		  }
		| {
				type: 'number';
				default?: number;
		  }
		| {
				type: 'array';
				default?: Array< unknown >;
		  }
		| {
				type: 'html';
				default: string;
				source: string;
				selector: string;
		  }
		| {
				type: 'object';
				default: Record< string, unknown >;
		  };
};

const exampleBlock = {
	attributes: {
		code: `// ✨ Code is poetry. ✨
/**
 * Find the nth fibonacci number (inefficiently)
 */
const fibonacci = ( n ) => n < 1 ? 0
  : n > 3 ? 1
  : fibonacci( n - 1 ) + fibonacci( n - 2 );`,
		language: 'JavaScript',
		languageConfidence: 'certain',
		filename: 'example.js',
	} satisfies Partial< Attributes >,
};

const icon = (
	// biome-ignore lint/a11y/noSvgWithoutTitle: The icon a11y is handled by the block editor.
	<svg width="24" height="24">
		<path d="m8.53 7.531-4.293 4.277a.25.25 0 0 0 0 .353l4.294 4.31-1.062 1.058-4.294-4.31a1.75 1.75 0 0 1-.116-2.342l.12-.132L7.47 6.47 8.529 7.53ZM18.53 5.53l-1.292 1.292a.25.25 0 0 0 .001.354l3.582 3.57.12.131a1.75 1.75 0 0 1-.116 2.343l-4.294 4.31-1.062-1.06 4.294-4.309a.25.25 0 0 0 .031-.314l-.031-.04-3.582-3.569a1.75 1.75 0 0 1-.003-2.476L17.47 4.47l1.06 1.06Z" />
	</svg>
);

registerBlockType( blockJson, {
	icon,
	example: exampleBlock,
	transforms,
	edit: withColors(
		...( [
			'colorComment',
			'colorKeyword',
			'colorBoolean',
			'colorLiteral',
			'colorString',
			'colorSpecialString',
			'colorMacroName',
			'colorVariableDefinition',
			'colorTypeName',
			'colorClassName',
			'colorInvalid',
		] satisfies ReadonlyArray< `${ keyof Pick<
			Attributes,
			Extract< keyof Attributes, `color${ Capitalize< string > }` >
		> }` > )
	)( ( props: EditBlockProps ) => {
		const { setAttributes, attributes } = props;

		const languageOptions = React.useMemo<
			ReadonlyArray< { readonly label: string; readonly value: string } >
		>( () => {
			const langOptions = langNames.map( lang => ( {
				label: lang,
				value: lang,
			} ) );
			langOptions.unshift( {
				label: __( 'Plain text', 'jetpack-mu-wpcom' ),
				value: '',
			} );
			return langOptions;
		}, [] );

		return (
			<>
				<InspectorControls group="color">
					<ColorTools { ...props } />
				</InspectorControls>
				<InspectorControls>
					<PanelBody title="Code Settings">
						<SelectControl
							label={ __( 'Language', 'jetpack-mu-wpcom' ) }
							value={ attributes.language }
							options={ languageOptions }
							onChange={ ( newLanguage: string ) => {
								setAttributes( {
									language: newLanguage,
									languageConfidence: 'certain',
								} );
							} }
							__next40pxDefaultSize
							__nextHasNoMarginBottom
						/>
						<ToggleControl
							label={ __( 'Show Language Name', 'jetpack-mu-wpcom' ) }
							checked={ attributes.showLanguageName }
							onChange={ ( next: boolean ) => setAttributes( { showLanguageName: next } ) }
							__nextHasNoMarginBottom
						/>
						<ToggleControl
							label={ __( 'Show Copy Button', 'jetpack-mu-wpcom' ) }
							checked={ attributes.showCopyButton }
							onChange={ ( next: boolean ) => setAttributes( { showCopyButton: next } ) }
							__nextHasNoMarginBottom
						/>
						<ToggleControl
							label={ __( 'Show Line Numbers', 'jetpack-mu-wpcom' ) }
							checked={ attributes.showLineNumbers }
							onChange={ ( next: boolean ) => setAttributes( { showLineNumbers: next } ) }
							__nextHasNoMarginBottom
						/>
						<TextControl
							label={ __( 'Line Numbers Start At', 'jetpack-mu-wpcom' ) }
							type="number"
							value={ attributes.lineNumbersStartAt }
							disabled={ ! attributes.showLineNumbers }
							onChange={ ( _nextLineNumbersStartAt: string ) => {
								let nextLineNumbersStartAt = Number( _nextLineNumbersStartAt );

								if ( ! Number.isFinite( nextLineNumbersStartAt ) ) {
									nextLineNumbersStartAt = 1;
								}
								if ( ! Number.isInteger( nextLineNumbersStartAt ) ) {
									nextLineNumbersStartAt = 1;
								}

								// Clamp to the allowed range
								nextLineNumbersStartAt = Math.max(
									LINE_NUMBER_START_MIN,
									Math.min( LINE_NUMBER_START_MAX, nextLineNumbersStartAt )
								);

								setAttributes( {
									lineNumbersStartAt: Number( nextLineNumbersStartAt ),
								} );
							} }
							min={ LINE_NUMBER_START_MIN }
							max={ LINE_NUMBER_START_MAX }
							__next40pxDefaultSize
							__nextHasNoMarginBottom
						/>
					</PanelBody>
				</InspectorControls>
				<React.Suspense fallback={ <Loading { ...props } /> }>
					<Chrome { ...props }>
						<EditCodeMirror { ...props } />
						<Notice status="warning" isDismissible={ false }>
							<b>Caution!</b> This block is experimental and <em>will</em> change. Existing content
							may break.
						</Notice>
					</Chrome>
				</React.Suspense>
			</>
		);
	} ),

	save: ( props: SaveBlockProps ) => {
		const { language, code } = props.attributes;

		return (
			<pre className="cm-content">
				<code
					className={
						language
							? `language-${ language.toLowerCase().replace( ' \t\n\r\f', '_' ) }`
							: undefined
					}
				>
					{ htmlEncode( code ) }
				</code>
			</pre>
		);
	},
} );

/*
 *
 * Color schemes are registered as block styles
 *
 */
registerBlockStyle( BLOCK_NAME, {
	name: 'no-highlight',
	/* translators: Color scheme with no syntax highlighting. */
	label: __( 'No highlight', 'jetpack-mu-wpcom' ),
} );
registerBlockStyle( BLOCK_NAME, {
	name: 'solarized-light',
	/* translators: Solarized is the name of a color scheme, "light" is the light version of it. */
	label: __( 'Solarized Light', 'jetpack-mu-wpcom' ),
} );
registerBlockStyle( BLOCK_NAME, {
	name: 'solarized-dark',
	/* translators: Solarized is the name of a color scheme, "dark" is the dark version of it. */
	label: __( 'Solarized Dark', 'jetpack-mu-wpcom' ),
} );
/*
 *
 * /Color schemes
 *
 */

type ChromeProps = {
	isLoading?: boolean;
} & React.PropsWithChildren< Props >;
const Chrome = ( { isLoading = false, ...props }: ChromeProps ) => {
	// Calculate the number of character represent the line number
	const maxLineNumberWidth =
		Math.floor(
			Math.log10(
				props.attributes.lineNumbersStartAt + ( props.attributes.tokenizedLines.length - 1 )
			)
		) + 1;

	const blockProps = useBlockProps( {
		className: [ isLoading && 'loading', props.attributes.showLineNumbers && 'show-line-numbers' ]
			.filter( x => Boolean( x ) )
			.join( ' ' ),
		...( props.attributes.showLineNumbers &&
			props.attributes.tokenizedLines.length && {
				'data-line-numbers-start-at': props.attributes.lineNumbersStartAt,
				'data-max-line-number-char-size': maxLineNumberWidth,
			} ),
		style: colorsToStyle( props.attributes ),
	} );

	const wpElementButtonClass =
		typeof __experimentalGetElementClassName === 'function'
			? __experimentalGetElementClassName( 'button' )
			: 'wp-element-button';

	if ( globalThis.SCRIPT_DEBUG ) {
		if ( typeof __experimentalGetElementClassName !== 'function' ) {
			console.warn( '__experimentalGetElementClassName not available.' );
		}
	}

	return (
		<div { ...blockProps }>
			<div className="a8c/code__header">
				<Filename { ...props } />
				{ ( props.attributes.showCopyButton || props.attributes.showLanguageName ) && (
					<div className="a8c/code__header-right">
						{ props.attributes.showCopyButton && (
							<button className={ `${ wpElementButtonClass } a8c/code__btn-copy` } type="button">
								{ __( 'Copy', 'jetpack-mu-wpcom' ) }
							</button>
						) }
						{ props.attributes.showLanguageName && <DisplayLanguage { ...props } /> }
					</div>
				) }
			</div>
			{ props.children }
		</div>
	);
};

const Filename = ( props: Props ) => {
	const { setAttributes, isSelected = false } = props;
	const { filename } = props.attributes;

	return isSelected ? (
		<TextControl
			label={ __( 'Filename', 'jetpack-mu-wpcom' ) }
			hideLabelFromVision
			className="a8c/code__filename"
			placeholder={ _x(
				'filename.txt',
				'An example filename input placeholder.',
				'jetpack-mu-wpcom'
			) }
			value={ filename }
			onChange={ ( nextValue: string ) => {
				// biome-ignore lint/style/noNonNullAssertion: setAttributes must exist here.
				setAttributes!( { filename: nextValue } );
			} }
			__next40pxDefaultSize
			__nextHasNoMarginBottom
		/>
	) : filename ? (
		<span className="a8c/code__filename">{ filename }</span>
	) : null;
};

const DisplayLanguage = ( props: Props ) => {
	const { attributes, setAttributes } = props;

	if ( ! attributes.language ) {
		return null;
	}

	const emptyOption = {
		name: __( 'Plain text', 'jetpack-mu-wpcom' ),
		key: '',
	};

	return props.isSelected ? (
		<CustomSelectControl
			className="a8c/code__language-select"
			label={ __( 'Language', 'jetpack-mu-wpcom' ) }
			hideLabelFromVision
			value={
				attributes.language ? { name: attributes.language, key: attributes.language } : emptyOption
			}
			options={ [
				emptyOption,
				...langNames.map( lang => ( {
					name: lang,
					key: lang,
				} ) ),
			] }
			onChange={ ( {
				selectedItem: { key: newLanguage },
			}: {
				selectedItem: { name: string; key: string };
			} ) => {
				// biome-ignore lint/style/noNonNullAssertion: Only called in edit.
				setAttributes!( {
					language: newLanguage,
					languageConfidence: 'certain',
				} );
			} }
			__next40pxDefaultSize
		/>
	) : (
		<span>{ attributes.language }</span>
	);
};

const Loading = ( props: EditBlockProps ) => {
	let code = props.attributes.code;
	if ( code.endsWith( '\n' ) ) {
		code += '\n';
	}

	return (
		<Chrome isLoading { ...props }>
			<pre className="cm-content">{ code }</pre>
			<Notice status="warning" isDismissible={ false }>
				<b>Caution!</b> This block is experimental and <em>will</em> change. Existing content may
				break.
			</Notice>
		</Chrome>
	);
};

/**
 *
 * @param attributes
 */
export function colorsToStyle( attributes: Attributes ): {
	[ key in `--${ keyof Pick<
		Attributes,
		Extract< keyof Attributes, `color${ Capitalize< string > }` >
	> }` ]-?: string | undefined;
} {
	const lineProperties: CSSProperties = {};
	if ( attributes.showLineNumbers && attributes.tokenizedLines.length ) {
		const maxLineNumberWidth =
			Math.floor(
				Math.log10( attributes.lineNumbersStartAt + ( attributes.tokenizedLines.length - 1 ) )
			) + 1;
		lineProperties[ '--line-numbers-start-at' ] = String( attributes.lineNumbersStartAt );
		lineProperties[ '--line-number-gutter-width' ] = `${ maxLineNumberWidth }ch`;
	}

	const backgroundProperties: CSSProperties = {};
	if ( attributes.backgroundColor ) {
		backgroundProperties[
			'--colorBackground'
		] = `var( --wp--preset--color--${ attributes.backgroundColor } )`;
	} else if ( attributes.style?.color?.background ) {
		backgroundProperties[ '--colorBackground' ] = attributes.style.color.background;
	}

	const textColorProperties: CSSProperties = {};
	if ( attributes.textColor ) {
		backgroundProperties[ '--colorText' ] = `var( --wp--preset--color--${ attributes.textColor } )`;
	} else if ( attributes.style?.color?.text ) {
		backgroundProperties[ '--colorText' ] = attributes.style.color.text;
	}

	return {
		'--colorComment': attributes.colorComment,
		'--colorKeyword': attributes.colorKeyword,
		'--colorBoolean': attributes.colorBoolean,
		'--colorLiteral': attributes.colorLiteral,
		'--colorString': attributes.colorString,
		'--colorSpecialString': attributes.colorSpecialString,
		'--colorMacroName': attributes.colorMacroName,
		'--colorVariableDefinition': attributes.colorVariableDefinition,
		'--colorTypeName': attributes.colorTypeName,
		'--colorClassName': attributes.colorClassName,
		'--colorInvalid': attributes.colorInvalid,
		...lineProperties,
		...backgroundProperties,
		...textColorProperties,
	} satisfies React.CSSProperties;
}

/**
 * Perform HTML encoding.
 *
 * This is designed to encode text for HTML printing. The characters `&`, `<`, `>`,
 * and `[` are HTML encoded.
 *
 * `[` is HTML encoded to prevent shortcodes from being processed.
 *
 * A numeric encoding is used for `&` as a workaround for
 * {@link https://core.trac.wordpress.org/ticket/63630|Trac 63630}.
 * The issue should be fixed in WordPress 6.9.
 * @param content
 */
function htmlEncode( content: string ): string {
	return content
		.replaceAll( '&', '&#38;' )
		.replaceAll( '<', '&lt;' )
		.replaceAll( '>', '&gt;' )
		.replaceAll( '[', '&#91;' );
}

const EditCodeMirror = React.lazy( async () => {
	const i = import( '@a8cCodeBlock/block-edit-function' );
	new Promise( resolve => {
		// biome-ignore lint/suspicious/noTsIgnore: just debugging
		// @ts-ignore
		window.__continue = resolve;
	} );
	return i;
} );
