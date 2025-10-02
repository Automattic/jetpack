// eslint-disable-next-line import/no-unresolved -- This is a virtual module provided by a webpack plugin.
import { extensionToLang } from '@@codemirrorLanguageData@@';
// @ts-expect-error No types.
import * as wpBlockEditor from '@wordpress/block-editor';
// @ts-expect-error No types.
import * as wpBlocks from '@wordpress/blocks';
import {
	CustomSelectControl,
	Notice,
	PanelBody,
	SelectControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import * as React from 'react';
import blockJson from '../common/block.json';
import {
	type Attributes,
	BLOCK_NAME,
	type EditBlockProps,
	type SaveBlockProps,
} from '../common/block.ts';
import { ColorTools } from './color-tools.tsx';
import { transforms } from './transforms.ts';

const {
	InspectorControls,
	useBlockProps,
	withColors,
	__experimentalGetElementClassName,
}: Window[ 'wp' ][ 'blockEditor' ] = wpBlockEditor;

const { registerBlockType, registerBlockStyle }: Window[ 'wp' ][ 'blocks' ] = wpBlocks;

const LINE_NUMBER_START_MIN = 0;
const LINE_NUMBER_START_MAX = 10_000;

type Props = EditBlockProps | SaveBlockProps;

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
	<svg width="24" height="24">
		<path d="m8.53 7.531-4.293 4.277a.25.25 0 0 0 0 .353l4.294 4.31-1.062 1.058-4.294-4.31a1.75 1.75 0 0 1-.116-2.342l.12-.132L7.47 6.47 8.529 7.53ZM18.53 5.53l-1.292 1.292a.25.25 0 0 0 .001.354l3.582 3.57.12.131a1.75 1.75 0 0 1-.116 2.343l-4.294 4.31-1.062-1.06 4.294-4.309a.25.25 0 0 0 .031-.314l-.031-.04-3.582-3.569a1.75 1.75 0 0 1-.003-2.476L17.47 4.47l1.06 1.06Z" />
	</svg>
);

const emptyLanguageOption = {
	key: '',
	name: __( 'Plain text', 'jetpack-mu-wpcom' ) as string,
};
const customSelectLanguageOptions: {
	readonly key: string;
	readonly name: string;
}[] = [ emptyLanguageOption ];
{
	const langNames = new Set< string >();
	extensionToLang.forEach( ( [ , lang ] ) => {
		langNames.add( lang );
	} );
	const sortedLangNames = Array.of( ...langNames );
	sortedLangNames.sort( ( a, b ) => a.localeCompare( b ) );
	sortedLangNames.forEach( lang =>
		customSelectLanguageOptions.push( {
			key: lang,
			name: lang,
		} )
	);
}
const selectLanguageOptions: ReadonlyArray< {
	readonly value: string;
	readonly label: string;
} > = customSelectLanguageOptions.map( ( { key, name } ) => ( {
	value: key,
	label: name,
} ) );

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
							options={ selectLanguageOptions }
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
							onChange={ ( next: boolean ) =>
								setAttributes( {
									showLanguageName: next,
								} )
							}
							__nextHasNoMarginBottom
						/>
						<ToggleControl
							label={ __( 'Show Copy Button', 'jetpack-mu-wpcom' ) }
							checked={ attributes.showCopyButton }
							onChange={ ( next: boolean ) =>
								setAttributes( {
									showCopyButton: next,
								} )
							}
							__nextHasNoMarginBottom
						/>
						<ToggleControl
							label={ __( 'Show Line Numbers', 'jetpack-mu-wpcom' ) }
							checked={ attributes.showLineNumbers }
							onChange={ ( next: boolean ) =>
								setAttributes( {
									showLineNumbers: next,
								} )
							}
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
									lineNumbersStartAt: nextLineNumbersStartAt,
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
		const { code } = props.attributes;
		return <CodeWrapper { ...props }>{ htmlEncode( code ) }</CodeWrapper>;
	},
} );

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
		style: blockStyle( props.attributes ),
	} );

	const wpElementButtonClass =
		typeof __experimentalGetElementClassName === 'function'
			? __experimentalGetElementClassName( 'button' )
			: 'wp-element-button';

	if ( ( globalThis as { SCRIPT_DEBUG?: unknown } ).SCRIPT_DEBUG ) {
		if ( typeof __experimentalGetElementClassName !== 'function' ) {
			// eslint-disable-next-line no-console -- Console message in debug.
			console.warn( '__experimentalGetElementClassName not available.' );
		}
	}

	return (
		<div { ...blockProps }>
			<div className="a8c/code__header">
				<Filename { ...props } />
				{ ( props.isSelected ||
					props.attributes.showCopyButton ||
					props.attributes.showLanguageName ) && (
					<div className="a8c/code__header-right">
						{ props.attributes.showCopyButton && (
							<button className={ `${ wpElementButtonClass } a8c/code__btn-copy` } type="button">
								{ __( 'Copy', 'jetpack-mu-wpcom' ) }
							</button>
						) }
						<DisplayLanguage { ...props } />
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

	const placeholderExtension =
		extensionToLang.find(
			( [ , languageName ] ) => props.attributes.language === languageName
		)?.[ 0 ] ?? 'txt';

	if ( isSelected ) {
		return (
			<TextControl
				label={ __( 'Filename', 'jetpack-mu-wpcom' ) }
				hideLabelFromVision
				className="a8c/code__filename"
				placeholder={ sprintf(
					/* translators: Placeholder for a filename input. %s is a file extension, like "txt". */
					__( 'filename.%s', 'jetpack-mu-wpcom' ),
					placeholderExtension
				) }
				value={ filename }
				onChange={ ( nextValue: string ) => {
					setAttributes!( { filename: nextValue } );
				} }
				__next40pxDefaultSize
				__nextHasNoMarginBottom
			/>
		);
	}
	if ( filename ) {
		return <span className="a8c/code__filename">{ filename }</span>;
	}
	return null;
};

const DisplayLanguage = ( props: Props ) => {
	const { attributes, setAttributes } = props;

	if ( props.isSelected ) {
		return (
			<CustomSelectControl
				className="a8c/code__language-select"
				label={ __( 'Language', 'jetpack-mu-wpcom' ) }
				hideLabelFromVision
				value={
					attributes.language
						? {
								key: attributes.language,
								name: attributes.language,
						  }
						: emptyLanguageOption
				}
				options={ customSelectLanguageOptions }
				onChange={ ( {
					selectedItem: { key: newLanguage },
				}: {
					selectedItem: { name: string; key: string };
				} ) => {
					setAttributes!( {
						language: newLanguage,
						languageConfidence: 'certain',
					} );
				} }
				__next40pxDefaultSize
			/>
		);
	}

	if ( ! props.attributes.showLanguageName || ! attributes.language ) {
		return null;
	}

	return <span>{ attributes.language }</span>;
};

/**
 * Loading Component for the Code Block.
 *
 * @param props - Component props.
 * @return Loading state UI.
 */
function Loading( props: EditBlockProps ): React.JSX.Element {
	let code = props.attributes.code;
	if ( ! code ) {
		code = __( 'Loading…', 'jetpack-mu-wpcom' );
	}
	return (
		<Chrome isLoading { ...props }>
			<CodeWrapper { ...props }>{ code }</CodeWrapper>
			<Notice status="warning" isDismissible={ false }>
				<b>Caution!</b> This block is experimental and <em>will</em> change. Existing content may
				break.
			</Notice>
		</Chrome>
	);
}

/**
 * This function wraps the code content when it is not managed by CodeMirror.
 *
 * @param props            - Component props.
 * @param props.attributes -- Block attributes.
 * @param props.children   -- Component children, the contents of the block.
 *
 * @return UI.
 */
function CodeWrapper( {
	attributes: { language },
	children: code,
}: {
	children: string;
	attributes: Pick< EditBlockProps[ 'attributes' ], 'language' >;
} ): React.JSX.Element {
	if ( code.endsWith( '\n' ) ) {
		code += '\n';
	}

	return (
		<pre className="cm-content">
			<code
				className={
					language
						? `language-${ language.toLowerCase().replaceAll( /[ \t\n\r\f]/g, '_' ) }`
						: undefined
				}
			>
				{ code }
			</code>
		</pre>
	);
}

/**
 * Style properties used by the block wrapper.
 */
type BlockStyleProperties = {
	/*
	 * This transforms the `color{Suffix}` attributes into the expected
	 * CSSProperties format with custom properties _and_ makes them required. This helps to
	 * ensure that this implementation remains in sync with the block attributes
	 * defined elsewhere.
	 *
	 * For example:
	 * `{ colorComment?: string; }`
	 * becomes
	 * `{ '--colorComment': string | undefined; }`
	 */
	[ key in `--${ keyof Pick<
		Attributes,
		Extract< keyof Attributes, `color${ Capitalize< string > }` >
	> }` ]-?: string | undefined;
} & {
	'--line-numbers-start-at'?: string;
	'--line-number-gutter-width'?: string;
	'--colorBackground'?: string;
	'--colorText'?: string;
};

/**
 * Transforms attributes into CSS custom properties for inline style use.
 *
 * @param attributes - Block attributes.
 * @return CSS style object.
 */
function blockStyle( attributes: Attributes ): BlockStyleProperties {
	const properties: BlockStyleProperties = {
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
	} satisfies React.CSSProperties;

	if ( attributes.showLineNumbers && attributes.tokenizedLines.length ) {
		const maxLineNumberWidth =
			Math.floor(
				Math.log10( attributes.lineNumbersStartAt + ( attributes.tokenizedLines.length - 1 ) )
			) + 1;
		properties[ '--line-numbers-start-at' ] = String( attributes.lineNumbersStartAt );
		properties[ '--line-number-gutter-width' ] = `${ maxLineNumberWidth }ch`;
	}

	if ( attributes.backgroundColor ) {
		properties[
			'--colorBackground'
		] = `var( --wp--preset--color--${ attributes.backgroundColor } )`;
	} else if ( attributes.style?.color?.background ) {
		properties[ '--colorBackground' ] = attributes.style.color.background;
	}
	if ( attributes.textColor ) {
		properties[ '--colorText' ] = `var( --wp--preset--color--${ attributes.textColor } )`;
	} else if ( attributes.style?.color?.text ) {
		properties[ '--colorText' ] = attributes.style.color.text;
	}

	return properties;
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
 * @param content - Original content.
 * @return Encoded content.
 */
function htmlEncode( content: string ): string {
	return content
		.replaceAll( '&', '&#38;' )
		.replaceAll( '<', '&lt;' )
		.replaceAll( '>', '&gt;' )
		.replaceAll( '[', '&#91;' )
		.replaceAll( "'", '&#39;' )
		.replaceAll( '"', '&#34;' );
}

const EditCodeMirror = React.lazy(
	// eslint-disable-next-line import/no-unresolved -- The feature registers this module for import.
	() => import( /* webpackIgnore: true */ '@a8cCodeBlock/block-edit-function' )
);
