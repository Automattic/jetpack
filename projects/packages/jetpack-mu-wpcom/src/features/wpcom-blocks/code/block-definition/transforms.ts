// eslint-disable-next-line import/no-unresolved -- This is a virtual module provided by a webpack plugin.
import { extensionToLang } from '@@codemirrorLanguageData@@';
import { createBlock } from '@wordpress/blocks';
import { dispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { RichTextData } from '@wordpress/rich-text';
import { type Attributes, BLOCK_NAME } from '../common/block.ts';

const CODE_FENCE_REGEXP = /^```([a-z0-9+-]*)$/i;

interface SyntaxHighlighterCodeAttributes extends Record< string, unknown > {
	content?: string;
	language?: string;
	lineNumbers?: boolean;
	firstLineNumber?: string;
}

export const transforms = {
	from: [
		// Handle code fence openers, e.g. ```js
		{
			type: 'enter',
			priority: 5,
			regExp: CODE_FENCE_REGEXP,
			transform: ( {
				content: _content,
			}: {
				// The structure of content changed between some Gutenberg versions.
				// The `{ content: string }` form appears to have been used
				// in Gutenberg 18.
				// Support both versions here.
				content: string | { text: string };
			} ) => {
				const content = typeof _content === 'string' ? _content : _content.text;
				// This same RegExp matched to enter this transform. It must not be null here.
				const [ , langCandidate ] = CODE_FENCE_REGEXP.exec( content )!;
				// This RegExp capture group 1 was part of the match and must be defined here (it could be empty string).
				const language = externalLanguageToBlockLanguage( langCandidate );

				if ( typeof language === 'undefined' ) {
					return createBlock( BLOCK_NAME );
				}

				return createBlock( BLOCK_NAME, {
					language,
					languageConfidence: 'certain',
				} );
			},
		},

		{
			type: 'block',
			blocks: [ 'core/html' ],
			priority: 5,
			transform: ( { content: text }: { content: string } ) => {
				return createBlock( 'core/code', {
					content: RichTextData.fromPlainText( text ),
					language: 'HTML',
					languageConfidence: 'certain',
				} );
			},
		},

		{
			type: 'block',
			blocks: [ 'kevinbatdorf/code-block-pro' ],
			transform: ( {
				code,
				...attributes
			}: {
				code: string;
				lineNumbers?: boolean;
				startingLineNumber?: number;
				lineHighlights?: string;
				language?: string;
			} ) => {
				const blockAttributes: Partial< Attributes > = {
					content: RichTextData.fromPlainText( code ),
				};
				if ( attributes.lineNumbers === true ) {
					blockAttributes.showLineNumbers = true;

					if ( attributes.startingLineNumber !== 1 ) {
						blockAttributes.lineNumbersStartAt = Number( attributes.startingLineNumber );
					}
				} else {
					blockAttributes.showLineNumbers = false;
				}

				const detectedLanguage = externalLanguageToBlockLanguage( attributes.language );

				if ( typeof detectedLanguage === 'string' ) {
					blockAttributes.language = detectedLanguage;
					blockAttributes.languageConfidence = 'certain';
				}

				return createBlock( BLOCK_NAME, blockAttributes );
			},
		},

		{
			type: 'block',
			blocks: [ 'syntaxhighlighter/code' ],
			transform: ( { content = '', ...attributes }: SyntaxHighlighterCodeAttributes ) => {
				const blockAttributes: Partial< Attributes > = {
					content: RichTextData.fromPlainText( content ),
				};

				/*
				 * This block uses 'xml' for all of the following languages:
				 * HTML / XHTML / XML / XSLT
				 *
				 * Add special handling to use 'HTML'.
				 */
				const detectedLanguage =
					attributes.language === 'xml'
						? 'HTML'
						: externalLanguageToBlockLanguage( attributes.language );

				if ( typeof detectedLanguage === 'string' ) {
					blockAttributes.language = detectedLanguage;
					blockAttributes.languageConfidence = 'certain';
				}

				if ( attributes.lineNumbers !== false ) {
					blockAttributes.showLineNumbers = true;

					if ( attributes.firstLineNumber ) {
						blockAttributes.lineNumbersStartAt = Number( attributes.firstLineNumber );
					}
				}

				return createBlock( BLOCK_NAME, blockAttributes );
			},
		},

		{
			type: 'files',
			isMatch: ( files: [ File, ...unknown[] ] ): boolean => {
				if ( files.length !== 1 ) {
					return false;
				}
				const [ file ] = files;

				// Bail on files larger than 1MB
				if ( file.size > 1_024 ** 2 ) {
					return false;
				}
				const language = getLanguageFromFile( file );
				return typeof language !== 'undefined';
			},
			transform: ( files: [ File, ...unknown[] ] ) => {
				const [ file ] = files;
				const language = getLanguageFromFile( file )!;

				const reader = new FileReader();
				reader.readAsText( file );

				const blockAttributes: Partial< Attributes > = {
					language,
					languageConfidence: 'certain',
					filename: file.name,
				};

				if ( reader.readyState === FileReader.DONE ) {
					if ( ! reader.error ) {
						blockAttributes.content = RichTextData.fromPlainText( reader.result as string );
					}
					return createBlock( BLOCK_NAME, blockAttributes );
				}

				const block = createBlock( BLOCK_NAME, blockAttributes );
				reader.addEventListener( 'load', () => {
					dispatch( editorStore ).updateBlockAttributes( [ block.clientId ], {
						content: RichTextData.fromPlainText( reader.result as string ),
						triggerCodeUpdate: true,
					} );
				} );
				return block;
			},
		},

		{
			type: 'raw',
			priority: 5,
			isMatch: ( node: Node ) =>
				node.nodeName === 'PRE' &&
				( node as HTMLPreElement ).children.length === 1 &&
				( node as HTMLPreElement ).firstChild!.nodeName === 'CODE',
			transform: ( node: HTMLPreElement ) => {
				// This structure was validated by the match already.
				const codeElement = node.firstChild as HTMLElement;

				const blockAttributes: Partial< Attributes > = {
					content: RichTextData.fromPlainText( codeElement.textContent || '' ),
				};

				const detectedLanguage = externalLanguageToBlockLanguage(
					codeElement.classList[ 0 ]?.substring( 'language-'.length )
				);

				if ( typeof detectedLanguage === 'string' ) {
					blockAttributes.language = detectedLanguage;
					blockAttributes.languageConfidence = 'certain';
				}

				return createBlock( BLOCK_NAME, blockAttributes );
			},
			schema: {
				pre: {
					children: {
						code: {
							classes: [ /^language-/i ],
							children: { '#text': {} },
						},
					},
				},
			},
		},
	],

	to: [
		{
			type: 'block',
			blocks: [ 'syntaxhighlighter/code' ],
			transform: ( attributes: Attributes ) => {
				const blockAttributes: SyntaxHighlighterCodeAttributes = {
					content: attributes.content.toPlainText(),
					lineNumbers: Boolean( attributes.showLineNumbers ),
					firstLineNumber: String( attributes.lineNumbersStartAt || 1 ),
				};
				return createBlock( 'syntaxhighlighter/code', blockAttributes );
			},
		},
	],
};

/**
 * Transform an external langauge name into a language name recognized by the block.
 *
 * The language recognition is permissive and recognizes langauges from other blocks' attributes
 * or from code fences.
 *
 * @param languageCandidate - The input language to match.
 * @return The block language name, or undefined if no match.
 */
function externalLanguageToBlockLanguage( languageCandidate: string | undefined ): string | void {
	if ( ! languageCandidate ) {
		return;
	}
	switch ( languageCandidate.toLowerCase() ) {
		case 'plain':
		case 'plaintext':
			return '';

		case 'apl':
			return 'APL';

		case 'c':
			return 'C';

		case 'csharp':
		case 'c#':
		case 'cs':
			return 'C#';

		case 'c++':
		case 'cpp':
			return 'C++';

		case 'clj':
		case 'clojure':
			return 'Clojure';

		case 'cmake':
			return 'CMake';

		case 'cobol':
			return 'Cobol';

		case 'coffee':
			return 'CoffeeScript';

		case 'lisp':
			return 'Common Lisp';

		case 'css':
			return 'CSS';

		case 'cypher':
		case 'cql':
			return 'Cypher';

		case 'd':
			return 'D';

		case 'dart':
			return 'Dart';

		case 'diff':
		case 'patch':
		case 'udiff':
			return 'diff';

		case 'containerfile':
		case 'docker':
		case 'dockerfile':
			return 'Dockerfile';

		case 'elm':
			return 'Elm';

		case 'erlang':
		case 'erl':
			return 'Erlang';

		case 'f#':
		case 'fs':
		case 'fsharp':
			return 'F#';

		case 'gherkin':
			return 'Gherkin';

		case 'go':
			return 'Go';

		case 'groovy':
			return 'Groovy';

		case 'haskell':
		case 'hs':
			return 'Haskell';

		case 'html':
		case 'xhtml':
			return 'HTML';

		case 'http':
			return 'HTTP';

		case 'java':
			return 'Java';

		case 'javascript':
		case 'js':
		case 'jscript':
		case 'node':
			return 'JavaScript';

		case 'jsx':
			return 'JSX';

		case 'json':
		case 'json5':
		case 'jsonc':
			return 'JSON';

		case 'jinja-html':
			return 'Jinja2';

		case 'julia':
			return 'Julia';

		case 'kotlin':
			return 'Kotlin';

		case 'latex':
			return 'LaTeX';

		case 'less':
			return 'LESS';

		case 'liquid':
			return 'Liquid';

		case 'lua':
			return 'Lua';

		case 'markdown':
		case 'md':
			return 'Markdown';

		case 'wolfram':
			return 'Mathematica';

		case 'nginx':
			return 'Nginx';

		case 'objective-c':
		case 'objc':
			return 'Objective-C';

		case 'objective-cpp':
			return 'Objective-C++';

		case 'ocaml':
			return 'OCaml';

		case 'pascal':
			return 'Pascal';

		case 'perl':
			return 'Perl';

		case 'php':
			return 'PHP';

		case 'powershell':
		case 'ps':
		case 'ps1':
			return 'PowerShell';

		case 'ini':
		case 'properties':
			return 'Properties files';

		case 'proto':
			return 'ProtoBuf';

		case 'pug':
			return 'Pug';

		case 'puppet':
			return 'Puppet';

		case 'py':
		case 'python':
		case 'python2':
		case 'python3':
			return 'Python';

		case 'r':
			return 'R';

		case 'ruby':
		case 'rb':
			return 'Ruby';

		case 'rust':
		case 'rs':
			return 'Rust';

		case 'sass':
			return 'Sass';

		case 'scala':
			return 'Scala';

		case 'scheme':
			return 'Scheme';

		case 'scss':
			return 'SCSS';

		case 'bash':
		case 'sh':
		case 'shell':
		case 'shellscript':
		case 'zsh':
			return 'Shell';

		case 'smalltalk':
			return 'Smalltalk';

		case 'sparql':
			return 'SPARQL';

		case 'sql':
			return 'SQL';

		case 'stylus':
		case 'styl':
			return 'Stylus';

		case 'swift':
			return 'Swift';

		case 'system-verilog':
			return 'SystemVerilog';

		case 'tcl':
			return 'Tcl';

		case 'tex':
			return 'Textile';

		case 'toml':
			return 'TOML';

		case 'tsx':
			return 'TSX';

		case 'turtle':
			return 'Turtle';

		case 'ts':
		case 'typescript':
			return 'TypeScript';

		case 'vb':
			return 'VB.NET';

		case 'verilog':
			return 'Verilog';

		case 'vhdl':
			return 'VHDL';

		case 'vue':
			return 'Vue';

		case 'wasm':
		case 'wast':
		case 'webassembly':
			return 'WebAssembly';

		case 'rss':
		case 'wsdl':
		case 'xml':
		case 'xsd':
			return 'XML';

		case 'yaml':
		case 'yml':
			return 'YAML';
	}
}

interface GetLanguageFromFile {
	( file: File ): string | undefined;
	extensionMap?: Map< string, string >;
}
const getLanguageFromFile: GetLanguageFromFile = ( file: File ): string | undefined => {
	switch ( file.type ) {
		case 'text/css':
			return 'CSS';

		case 'text/html':
			return 'HTML';

		case 'text/javascript':
			return 'JavaScript';

		case 'application/json':
			return 'JSON';

		case 'text/markdown':
			return 'Markdown';

		case 'application/sql':
			return 'SQL';

		case 'application/toml':
			return 'TOML';

		case 'application/wasm':
			return 'WebAssembly';

		case 'application/xhtml+xml':
		case 'application/xml':
		case 'text/xml':
			return 'XML';

		case 'application/yaml':
			return 'YAML';
	}

	if ( ! getLanguageFromFile.extensionMap ) {
		getLanguageFromFile.extensionMap = new Map(
			extensionToLang as unknown as ReadonlyArray< [ string, string ] >
		);
	}

	/*
	 * The following line contains a non-null assertion (!).
	 * `String.split()` can never return an empty array,
	 * so `.at(-1)` (the last element) can never be undefined.
	 */
	const extension = file.name.split( '.' ).at( -1 )!.toLowerCase();
	return getLanguageFromFile.extensionMap.get( extension );
};
