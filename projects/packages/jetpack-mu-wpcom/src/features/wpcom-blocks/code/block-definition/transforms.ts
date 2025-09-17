import { BLOCK_NAME } from '../common/block.ts';
import extensionToLang from './extensions-to-langs.json';
import type { Attributes } from '../common/block.ts';

const { createBlock } = window.wp.blocks;
const { dispatch } = window.wp.data;
const { store: editorStore } = window.wp.editor;

const CODE_FENCE_REGEXP = /^```([a-z0-9+-]*)$/i;

export const transforms = {
	to: [
		{
			type: 'block',
			blocks: [ 'core/code' ],
			transform: ( attrs: Attributes ) => {
				const code = attrs.code;
				const div = document.createElement( 'div' );
				div.innerText = code;
				const content = div.innerHTML;
				return createBlock( 'core/code', { content } );
			},
		},
	],

	from: [
		// Handle GH-like code fence openers, e.g. ```js
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
				const [ , langCandidate ] = CODE_FENCE_REGEXP.exec( content )!;

				let language;
				switch ( langCandidate?.toLowerCase() ) {
					case 'c':
						language = 'C';
						break;

					case 'c++':
					case 'cpp':
						language = 'C++';
						break;

					case 'css':
						language = 'CSS';
						break;

					case 'diff':
					case 'udiff':
					case 'patch':
						language = 'diff';
						break;

					case 'dockerfile':
					case 'containerfile':
						language = 'Dockerfile';
						break;

					case 'javascript':
					case 'js':
					case 'node':
						language = 'JavaScript';
						break;

					case 'jsx':
						language = 'JSX';
						break;

					case 'json':
					case 'json5':
					case 'jsonc':
						language = 'JSON';
						break;

					case 'hs':
					case 'haskell':
						language = 'Haskell';
						break;

					case 'typescript':
					case 'ts':
						language = 'TypeScript';
						break;

					case 'tsx':
						language = 'TSX';
						break;

					case 'php':
						language = 'PHP';
						break;

					case 'py':
					case 'python':
					case 'python2':
					case 'python3':
						language = 'Python';
						break;

					case 'html':
					case 'xhtml':
						language = 'HTML';
						break;

					case 'rust':
					case 'rs':
						language = 'Rust';
						break;

					case 'sql':
						language = 'SQL';
						break;

					case 'toml':
						language = 'TOML';
						break;

					case 'webassembly':
					case 'wasm':
					case 'wast':
						language = 'WebAssembly';
						break;

					case 'xml':
					case 'rss':
					case 'xsd':
					case 'wsdl':
						language = 'XML';
						break;

					case 'yaml':
					case 'yml':
						language = 'YAML';
						break;
				}

				if ( ! language ) {
					return createBlock< Attributes >( BLOCK_NAME );
				}

				return createBlock< Attributes >( BLOCK_NAME, {
					language,
					languageConfidence: 'certain',
				} );
			},
		},

		{
			type: 'block',
			blocks: [ 'core/code' ],
			transform: ( { content }: { content: { text: string } } ) => {
				return createBlock< Attributes >( BLOCK_NAME, {
					code: content.text,
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
					code: code,
				};
				if ( attributes.lineNumbers === true ) {
					blockAttributes.showLineNumbers = true;

					if ( attributes.startingLineNumber !== 1 ) {
						blockAttributes.lineNumbersStartAt = Number( attributes.startingLineNumber );
					}
				} else {
					blockAttributes.showLineNumbers = false;
				}

				switch ( attributes.language ) {
					case 'apl':
						blockAttributes.language = 'APL';
						break;
					case 'c':
						blockAttributes.language = 'C';
						break;
					case 'clj':
					case 'clojure':
						blockAttributes.language = 'Clojure';
						break;
					case 'cmake':
						blockAttributes.language = 'CMake';
						break;
					case 'cobol':
						blockAttributes.language = 'Cobol';
						break;
					case 'cypher':
						blockAttributes.language = 'Cypher';
						break;
					case 'cql':
						blockAttributes.language = 'Cypher';
						break;
					case 'coffee':
						blockAttributes.language = 'CoffeeScript';
						break;
					case 'cpp':
						blockAttributes.language = 'C++';
						break;
					case 'csharp':
					case 'c#':
					case 'cs':
						blockAttributes.language = 'C#';
						break;
					case 'css':
						blockAttributes.language = 'CSS';
						break;
					case 'd':
						blockAttributes.language = 'D';
						break;
					case 'dart':
						blockAttributes.language = 'Dart';
						break;
					case 'diff':
						blockAttributes.language = 'diff';
						break;
					case 'docker':
					case 'dockerfile':
						blockAttributes.language = 'Dockerfile';
						break;
					case 'elm':
						blockAttributes.language = 'Elm';
						break;
					case 'erlang':
					case 'erl':
						blockAttributes.language = 'Erlang';
						break;
					case 'fsharp':
					case 'f#':
					case 'fs':
						blockAttributes.language = 'F#';
						blockAttributes.language = 'F#';
						break;
					case 'gherkin':
						blockAttributes.language = 'Gherkin';
						break;
					case 'go':
						blockAttributes.language = 'Go';
						break;
					case 'groovy':
						blockAttributes.language = 'Groovy';
						break;
					case 'haskell':
					case 'hs':
						blockAttributes.language = 'Haskell';
						break;
					case 'html':
						blockAttributes.language = 'HTML';
						break;
					case 'http':
						blockAttributes.language = 'HTTP';
						break;
					case 'ini':
					case 'properties':
						blockAttributes.language = 'Properties files';
						break;
					case 'java':
						blockAttributes.language = 'Java';
						break;
					case 'javascript':
					case 'js':
						blockAttributes.language = 'JavaScript';
						break;
					case 'jinja-html':
						blockAttributes.language = 'Jinja2';
						break;
					case 'json':
					case 'json5':
					case 'jsonc':
						blockAttributes.language = 'JSON';
						break;
					case 'jsx':
						blockAttributes.language = 'JSX';
						break;
					case 'julia':
						blockAttributes.language = 'Julia';
						break;
					case 'kotlin':
						blockAttributes.language = 'Kotlin';
						break;
					case 'latex':
						blockAttributes.language = 'LaTeX';
						break;
					case 'less':
						blockAttributes.language = 'LESS';
						break;
					case 'liquid':
						blockAttributes.language = 'Liquid';
						break;
					case 'lisp':
						blockAttributes.language = 'Common Lisp';
						break;
					case 'lua':
						blockAttributes.language = 'Lua';
						break;
					case 'markdown':
					case 'md':
						blockAttributes.language = 'Markdown';
						break;
					case 'nginx':
						blockAttributes.language = 'Nginx';
						break;
					case 'objective-c':
					case 'objc':
						blockAttributes.language = 'Objective-C';
						break;
					case 'objective-cpp':
						blockAttributes.language = 'Objective-C++';
						break;
					case 'ocaml':
						blockAttributes.language = 'OCaml';
						break;
					case 'pascal':
						blockAttributes.language = 'Pascal';
						break;
					case 'perl':
						blockAttributes.language = 'Perl';
						break;
					case 'php':
						blockAttributes.language = 'PHP';
						break;
					case 'plaintext':
						blockAttributes.language = '';
						break;
					case 'powershell':
					case 'ps':
					case 'ps1':
						blockAttributes.language = 'PowerShell';
						break;
					case 'proto':
						blockAttributes.language = 'ProtoBuf';
						break;
					case 'pug':
						blockAttributes.language = 'Pug';
						break;
					case 'puppet':
						blockAttributes.language = 'Puppet';
						break;
					case 'python':
					case 'py':
						blockAttributes.language = 'Python';
						break;
					case 'r':
						blockAttributes.language = 'R';
						break;
					case 'ruby':
					case 'rb':
						blockAttributes.language = 'Ruby';
						break;
					case 'rust':
					case 'rs':
						blockAttributes.language = 'Rust';
						break;
					case 'sass':
						blockAttributes.language = 'Sass';
						break;
					case 'scala':
						blockAttributes.language = 'Scala';
						break;
					case 'scheme':
						blockAttributes.language = 'Scheme';
						break;
					case 'scss':
						blockAttributes.language = 'SCSS';
						break;
					case 'bash':
					case 'sh':
					case 'shell':
					case 'shellscript':
					case 'zsh':
						blockAttributes.language = 'Shell';
						break;
					case 'smalltalk':
						blockAttributes.language = 'Smalltalk';
						break;
					case 'sparql':
						blockAttributes.language = 'SPARQL';
						break;
					case 'sql':
						blockAttributes.language = 'SQL';
						break;
					case 'stylus':
					case 'styl':
						blockAttributes.language = 'Stylus';
						break;
					case 'swift':
						blockAttributes.language = 'Swift';
						break;
					case 'system-verilog':
						blockAttributes.language = 'SystemVerilog';
						break;
					case 'tcl':
						blockAttributes.language = 'Tcl';
						break;
					case 'tex':
						blockAttributes.language = 'Textile';
						break;
					case 'toml':
						blockAttributes.language = 'TOML';
						break;
					case 'tsx':
						blockAttributes.language = 'TSX';
						break;
					case 'turtle':
						blockAttributes.language = 'Turtle';
						break;
					case 'typescript':
					case 'ts':
						blockAttributes.language = 'TypeScript';
						break;
					case 'vb':
						blockAttributes.language = 'VB.NET';
						break;
					case 'verilog':
						blockAttributes.language = 'Verilog';
						break;
					case 'vhdl':
						blockAttributes.language = 'VHDL';
						break;
					case 'vue':
						blockAttributes.language = 'Vue';
						break;
					case 'wasm':
						blockAttributes.language = 'WebAssembly';
						break;
					case 'wolfram':
						blockAttributes.language = 'Mathematica';
						break;
					case 'xml':
						blockAttributes.language = 'XML';
						break;
					case 'yaml':
						blockAttributes.language = 'YAML';
						break;
					case 'yml':
						blockAttributes.language = 'YAML';
						break;
				}

				if ( blockAttributes.language ) {
					blockAttributes.languageConfidence = 'certain';
				}

				return createBlock< Attributes >( BLOCK_NAME, blockAttributes );
			},
		},

		{
			type: 'block',
			blocks: [ 'syntaxhighlighter/code' ],
			transform: ( {
				content = '',
				...attributes
			}: {
				content?: string;
				language?: string;
				firstLineNumber?: string;
			} ) => {
				const blockAttributes: Partial< Attributes > = {
					code: content,
				};

				switch ( attributes.language ) {
					// 'ActionScript'
					case 'as3':
						break;
					// 'Arduino'
					case 'arduino':
						break;
					// 'BASH / Shell'
					case 'bash':
						blockAttributes.language = 'Shell';
						break;
					// 'ColdFusion'
					case 'coldfusion':
						// XML???
						break;
					// 'Clojure'
					case 'clojure':
						blockAttributes.language = 'Clojure';
						break;
					// 'C / C++'
					case 'cpp':
						blockAttributes.language = 'C++';
						break;
					// 'C#'
					case 'csharp':
						blockAttributes.language = 'C#';
						break;
					// 'CSS'
					case 'css':
						blockAttributes.language = 'CSS';
						break;
					// 'Delphi / Pascal'
					case 'delphi':
						break;
					// 'diff / patch'
					case 'diff':
						blockAttributes.language = 'diff';
						break;
					// 'Erlang'
					case 'erlang':
						blockAttributes.language = 'Erlang';
						break;
					// 'F#'
					case 'fsharp':
						blockAttributes.language = 'F#';
						break;
					// 'Go'
					case 'go':
						blockAttributes.language = 'Go';
						break;
					// 'Groovy'
					case 'groovy':
						blockAttributes.language = 'Groovy';
						break;
					// 'Haskell'
					case 'haskell':
						blockAttributes.language = 'Haskell';
						break;
					// 'Java'
					case 'java':
						blockAttributes.language = 'Java';
						break;
					// 'JavaFX'
					case 'javafx':
						break;
					// 'JavaScript'
					case 'jscript':
						blockAttributes.language = 'JavaScript';
						break;
					// 'LaTeX'
					case 'latex':
						blockAttributes.language = 'LaTeX';
						break;
					// 'MATLAB'
					case 'matlabkey':
						break;
					// 'Objective-C'
					case 'objc':
						blockAttributes.language = 'Objective-C';
						break;
					// 'Perl'
					case 'perl':
						blockAttributes.language = 'Perl';
						break;
					// 'PHP'
					case 'php':
						blockAttributes.language = 'PHP';
						break;
					// 'Plain Text'
					case 'plain':
						blockAttributes.language = '';
						break;
					// 'PowerShell'
					case 'powershell':
						blockAttributes.language = 'PowerShell';
						break;
					// 'Python'
					case 'python':
						blockAttributes.language = 'Python';
						break;
					// 'R'
					case 'r':
						blockAttributes.language = 'R';
						break;
					// 'Ruby / Ruby on Rails'
					case 'ruby':
						blockAttributes.language = 'Ruby';
						break;
					// 'Scala'
					case 'scala':
						blockAttributes.language = 'Scala';
						break;
					// 'Swift'
					case 'swift':
						blockAttributes.language = 'Swift';
						break;
					// 'SQL'
					case 'sql':
						blockAttributes.language = 'SQL';
						break;
					// 'Visual Basic'
					case 'vb':
						blockAttributes.language = 'VB.NET';
						break;
					// 'HTML / XHTML / XML / XSLT'
					case 'xml':
						// Should we default to HTML?
						blockAttributes.language = 'HTML';
						break;
					// 'YAML'
					case 'yaml':
						blockAttributes.language = 'YAML';
						break;
				}

				if ( blockAttributes.language ) {
					blockAttributes.languageConfidence = 'certain';
				}

				if ( attributes.firstLineNumber ) {
					blockAttributes.lineNumbersStartAt = Number( attributes.firstLineNumber );
				}

				return createBlock< Attributes >( BLOCK_NAME, blockAttributes );
			},
		},

		{
			type: 'files',
			isMatch: ( files: [ File, ...unknown[] ] ): boolean => {
				if ( files.length !== 1 ) {
					return false;
				}
				const [ file ] = files;

				// Bail on files larger than 10KB
				if ( file.size > 10 * 1_024 ) {
					return false;
				}
				const language = getLanguage( file );
				return typeof language !== 'undefined';
			},
			transform: ( files: [ File, ...unknown[] ] ) => {
				const [ file ] = files;
				const language = getLanguage( file )!;

				// Grab the last segment of the file name. Try to handle different path separators.
				const filename = file.name.split( /[\\/]/ ).at( -1 ) ?? '';

				const block = createBlock< Attributes >( BLOCK_NAME, {
					language,
					languageConfidence: 'certain',
					filename,
				} );

				const reader = new FileReader();
				reader.addEventListener( 'load', event => {
					const code = event.target?.result as string;
					dispatch( editorStore ).updateBlockAttributes( [ block.clientId ], {
						code,
						triggerCodeUpdate: true,
					} );
				} );
				reader.readAsText( file );

				return block;
			},
		},
	],
};

interface GetLanguage {
	( file: File ): string | undefined;
	extensionMap?: Map< string, string >;
}
const getLanguage: GetLanguage = ( file: File ) => {
	if ( ! getLanguage.extensionMap ) {
		getLanguage.extensionMap = new Map(
			extensionToLang as unknown as ReadonlyArray< [ string, string ] >
		);
	}

	const extension = file.name.split( '.' ).at( -1 )!.toLowerCase();
	return getLanguage.extensionMap.get( extension );
};
