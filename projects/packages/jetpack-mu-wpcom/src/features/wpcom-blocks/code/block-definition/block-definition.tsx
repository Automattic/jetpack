// eslint-disable-next-line import/no-unresolved -- This is a virtual module provided by a webpack plugin.
import { extensionToLang } from '@@codemirrorLanguageData@@';
// @ts-expect-error No types.
import * as wpBlockEditor from '@wordpress/block-editor';
import { registerBlockStyle } from '@wordpress/blocks';
import {
	Button,
	Dropdown,
	MenuGroup,
	MenuItem,
	NavigableMenu,
	PanelBody,
	SelectControl,
	TextControl,
	ToggleControl,
	ToolbarGroup,
} from '@wordpress/components';
import { addFilter } from '@wordpress/hooks';
import { __, sprintf } from '@wordpress/i18n';
import * as React from 'react';
import {
	type Attributes,
	BLOCK_NAME,
	type EditBlockProps,
	type SaveBlockProps,
} from '../common/block.ts';
import { ColorTools } from './color-tools.tsx';
import { transforms } from './transforms.ts';

const {
	__experimentalGetElementClassName,
	BlockControls,
	InspectorControls,
	useBlockProps,
	withColors,
}: Window[ 'wp' ][ 'blockEditor' ] = wpBlockEditor;

const LINE_NUMBER_START_MIN = 0;
const LINE_NUMBER_START_MAX = 10_000;

type Props = EditBlockProps | SaveBlockProps;
const plainLanguageName = __( 'Plain text', 'jetpack-mu-wpcom' ) as string;

interface LanguageOption {
	readonly value: string;
	readonly label: string;
}
const emptyLanguageOption: LanguageOption = {
	value: '',
	label: plainLanguageName,
};

/**
 * Modify language names for display.
 *
 * @param language - Original language name.
 * @return Display language name.
 */
function languageNameDisplay( language: string ): string {
	switch ( language ) {
		case 'Brainfuck':
			return 'Brainf***';
	}

	return language;
}

const selectLanguageOptions: ReadonlyArray< LanguageOption > = [];
{
	const langNames = new Set< string >();
	extensionToLang.forEach( ( [ , lang ] ) => {
		langNames.add( lang );
	} );
	const sortedLangNames = Array.of( ...langNames );
	sortedLangNames.sort( ( a, b ) => a.localeCompare( b ) );
	sortedLangNames.forEach( lang =>
		( selectLanguageOptions as LanguageOption[] ).push( {
			value: lang,
			label: languageNameDisplay( lang ),
		} )
	);
}

const selectPopularLanguageOptions: ReadonlyArray< LanguageOption > = [];
{
	const popularLanguages = new Set< string >( [
		'JavaScript',
		'HTML',
		'CSS',
		'SQL',
		'Python',
		'Java',
		'C++',
		'PHP',
		'TypeScript',
		'Bash',
	] );
	for ( const opt of selectLanguageOptions ) {
		if ( popularLanguages.has( opt.value ) ) {
			( selectPopularLanguageOptions as LanguageOption[] ).push( opt );
		}
	}
}

/**
 * Filter to enhance the core code block.
 *
 * @param settings - Block settings
 * @return Modified settings.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- No good interface available for this type now.
function filterBlockRegistration( settings: any ) {
	/*
	 * The enhanced code block includes a "from" transform that handles things like language
	 * name, line number settings, etc. Remove the "to" transform provided by syntaxhighlighter/code
	 * so that simpler transform is not applied.
	 */
	if ( settings.name === 'syntaxhighlighter/code' ) {
		if ( settings.transforms?.to ) {
			settings.transforms.to = settings.transforms.to.filter(
				( transform: { type: string; blocks?: unknown } ) =>
					! (
						transform.type === 'block' &&
						Array.isArray( transform.blocks ) &&
						transform.blocks.length === 1 &&
						transform.blocks[ 0 ] === 'core/code'
					)
			);
		}
		return settings;
	}
	if ( settings.name !== 'core/code' ) {
		return settings;
	}

	settings.edit = blockEdit;
	settings.save = blockSave;
	if ( settings.example?.content ) {
		settings.example.language = 'JavaScript';
		settings.example.languageConfidence = 'certain';
		settings.example.filename = 'example.js';
	}

	if ( ! settings.transforms ) {
		settings.transforms = {
			from: transforms.from,
			to: transforms.to,
		};
	} else {
		settings.transforms.from = [ ...transforms.from, ...settings.transforms.from ];
		settings.transforms.to = [ ...transforms.to, ...settings.transforms.to ];
	}

	// Disable the contrast checker warning for the enhanced Code block.
	// The block uses custom syntax highlighting colors that may trigger false positive warnings.
	if ( ! settings.supports ) {
		settings.supports = {};
	}
	if ( ! settings.supports.color ) {
		settings.supports.color = {};
	}
	settings.supports.color.enableContrastChecker = false;

	return settings;
}

const blockEdit = withColors(
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

	const placeholderExtension =
		extensionToLang.find(
			( [ , languageName ] ) => props.attributes.language === languageName
		)?.[ 0 ] ?? 'txt';

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<Dropdown
						popoverProps={ {
							isAlternate: true,
							position: 'bottom right left',
							focusOnMount: true,
						} }
						renderToggle={ ( { isOpen, onToggle }: { isOpen: boolean; onToggle: () => void } ) => (
							<Button onClick={ onToggle } aria-expanded={ isOpen } aria-haspopup="true">
								{ languageNameDisplay( props.attributes.language || emptyLanguageOption.label ) }
							</Button>
						) }
						renderContent={ ( { onClose }: { onClose: () => void } ) => (
							<NavigableMenu role="menu">
								<MenuGroup>
									<MenuItem
										key={ emptyLanguageOption.value }
										role="menuitemradio"
										isSelected={ emptyLanguageOption.value === props.attributes.language }
										onClick={ () => {
											props.setAttributes( {
												language: emptyLanguageOption.value,
												languageConfidence: 'certain',
											} );
											onClose();
										} }
									>
										{ emptyLanguageOption.label }
									</MenuItem>
									{ selectLanguageOptions.map( option => (
										<MenuItem
											key={ option.value }
											role="menuitemradio"
											isSelected={ option.value === props.attributes.language }
											onClick={ () => {
												props.setAttributes( {
													language: option.value,
													languageConfidence: 'certain',
												} );
												onClose();
											} }
										>
											{ option.label }
										</MenuItem>
									) ) }
								</MenuGroup>
							</NavigableMenu>
						) }
					/>
				</ToolbarGroup>
			</BlockControls>
			<InspectorControls group="color">
				<ColorTools { ...props } />
			</InspectorControls>
			<InspectorControls>
				<PanelBody title="Settings">
					<SelectControl
						label={ __( 'Language', 'jetpack-mu-wpcom' ) }
						value={ attributes.language }
						onChange={ ( newLanguage: string ) => {
							setAttributes( {
								language: newLanguage,
								languageConfidence: 'certain',
							} );
						} }
						__next40pxDefaultSize
						__nextHasNoMarginBottom
					>
						<option value="">{ languageNameDisplay( plainLanguageName ) }</option>
						<optgroup label={ __( 'Popular Languages', 'jetpack-mu-wpcom' ) }>
							{ selectPopularLanguageOptions.map( option => (
								<option key={ option.value } value={ option.value }>
									{ option.label }
								</option>
							) ) }
						</optgroup>
						<optgroup label={ __( 'All Languages', 'jetpack-mu-wpcom' ) }>
							{ selectLanguageOptions.map( option => (
								<option key={ option.value } value={ option.value }>
									{ option.label }
								</option>
							) ) }
						</optgroup>
					</SelectControl>
					<TextControl
						label={ __( 'Filename', 'jetpack-mu-wpcom' ) }
						value={ attributes.filename }
						onChange={ ( nextValue: string ) => {
							setAttributes( { filename: nextValue.trim() } );
						} }
						placeholder={ sprintf(
							/* translators: Placeholder for a filename input. %s is a file extension, like "txt". */
							__( 'filename.%s', 'jetpack-mu-wpcom' ),
							placeholderExtension
						) }
						__next40pxDefaultSize
						__nextHasNoMarginBottom
					/>
					<ToggleControl
						label={ __( 'Show language name', 'jetpack-mu-wpcom' ) }
						checked={ attributes.showLanguageName }
						onChange={ ( next: boolean ) => {
							setAttributes( { showLanguageName: next } );
						} }
						__nextHasNoMarginBottom
					/>
					<ToggleControl
						label={ __( 'Show copy button', 'jetpack-mu-wpcom' ) }
						checked={ attributes.showCopyButton }
						onChange={ ( next: boolean ) => {
							setAttributes( { showCopyButton: next } );
						} }
						__nextHasNoMarginBottom
					/>
					<ToggleControl
						label={ __( 'Show line numbers', 'jetpack-mu-wpcom' ) }
						checked={ attributes.showLineNumbers }
						onChange={ ( next: boolean ) => {
							setAttributes( { showLineNumbers: next } );
						} }
						__nextHasNoMarginBottom
					/>
					{ attributes.showLineNumbers && (
						<TextControl
							label={ __( 'Line numbers start at', 'jetpack-mu-wpcom' ) }
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
					) }
				</PanelBody>
			</InspectorControls>
			<React.Suspense fallback={ <Loading { ...props } /> }>
				<Chrome { ...props }>
					<EditCodeMirror { ...props } />
				</Chrome>
			</React.Suspense>
		</>
	);
} );

const blockSave = ( props: SaveBlockProps ) => {
	const {
		content: { text: code },
	} = props.attributes;
	return (
		<CodeWrapper wrapperProps={ useBlockProps.save() } { ...props }>
			{ htmlEncode( code ) }
		</CodeWrapper>
	);
};

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

	if ( ( globalThis as { SCRIPT_DEBUG?: unknown } ).SCRIPT_DEBUG ) {
		if ( typeof __experimentalGetElementClassName !== 'function' ) {
			// eslint-disable-next-line no-console -- Console message in debug.
			console.warn( '__experimentalGetElementClassName not available.' );
		}
	}

	return (
		<div { ...blockProps }>
			<BlockHeader { ...props } />
			{ props.children }
		</div>
	);
};

const BlockHeader = ( props: Props ) => {
	const showRightSection = props.attributes.showCopyButton || props.attributes.showLanguageName;
	if ( ! props.attributes.filename && ! showRightSection ) {
		return null;
	}

	const wpElementButtonClass =
		typeof __experimentalGetElementClassName === 'function'
			? __experimentalGetElementClassName( 'button' )
			: 'wp-element-button';

	const onClick = () => {
		navigator.clipboard.writeText( props.attributes.content.toPlainText() ).catch();
	};

	return (
		<div className="a8c/code__header">
			<Filename { ...props } />
			{ showRightSection && (
				<div className="a8c/code__header-right">
					{ props.attributes.showCopyButton && (
						<button
							className={ `${ wpElementButtonClass } a8c/code__btn-copy` }
							type="button"
							onClick={ onClick }
						>
							{ __( 'Copy', 'jetpack-mu-wpcom' ) }
						</button>
					) }
					{ props.attributes.showLanguageName ? (
						<span>{ languageNameDisplay( props.attributes.language || plainLanguageName ) }</span>
					) : null }
				</div>
			) }
		</div>
	);
};

const Filename = ( props: Props ) => {
	if ( ! props.attributes.filename ) {
		return null;
	}
	return <span className="a8c/code__filename">{ props.attributes.filename }</span>;
};

/**
 * Loading Component for the Code Block.
 *
 * @param props - Component props.
 * @return Loading state UI.
 */
function Loading( props: EditBlockProps ): React.JSX.Element {
	let code = props.attributes.content.text;
	if ( ! code ) {
		code = __( 'Loading…', 'jetpack-mu-wpcom' );
	}
	return (
		<Chrome isLoading { ...props }>
			<CodeWrapper { ...props }>{ code }</CodeWrapper>
		</Chrome>
	);
}

/**
 * This function wraps the code content when it is not managed by CodeMirror.
 *
 * @param props              - Component props.
 * @param props.children     - Component children, the contents of the block.
 * @param props.wrapperProps - Props to pass to the PRE container element.
 *
 * @return UI.
 */
function CodeWrapper( {
	children: code,
	wrapperProps,
}: {
	children: string;
	wrapperProps?: React.HTMLAttributes< HTMLPreElement >;
} ): React.JSX.Element {
	if ( code.endsWith( '\n' ) ) {
		code += '\n';
	}

	return (
		<pre { ...wrapperProps }>
			<code>{ code }</code>
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

addFilter( 'blocks.registerBlockType', 'jetpack/enhance-core-code-block', filterBlockRegistration );
