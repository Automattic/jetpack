import { useBlockProps } from '@wordpress/block-editor';
import { Button, TextareaControl } from '@wordpress/components';
import { useState, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import type { BlockEditProps } from '@wordpress/blocks';
import './editor.scss';

const KATEX_CSS = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
const KATEX_JS = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';

interface BlockAttributes {
	latex: string;
	editing: boolean;
}

// Extend the global Window interface to include katex
declare global {
	interface Window {
		katex?: {
			renderToString: (
				latex: string,
				options: { throwOnError: boolean; displayMode: boolean }
			) => string;
		};
	}
}

function ensureKatexLoaded( onLoad: () => void ): void {
	if ( typeof window.katex !== 'undefined' ) {
		onLoad();
		return;
	}
	if ( ! document.querySelector( 'link[data-katex]' ) ) {
		const link = document.createElement( 'link' );
		link.rel = 'stylesheet';
		link.href = KATEX_CSS;
		link.setAttribute( 'data-katex', 'true' );
		document.head.appendChild( link );
	}
	if ( ! document.querySelector( 'script[data-katex]' ) ) {
		const script = document.createElement( 'script' );
		script.src = KATEX_JS;
		script.async = true;
		script.setAttribute( 'data-katex', 'true' );
		script.onload = onLoad;
		document.body.appendChild( script );
	} else {
		const existingScript = document.querySelector( 'script[data-katex]' ) as HTMLScriptElement;
		existingScript.addEventListener( 'load', onLoad, { once: true } );
	}
}

export default function Edit( {
	attributes,
	setAttributes,
	isSelected,
}: BlockEditProps< BlockAttributes > ) {
	const { latex = '', editing = true } = attributes;
	const [ preview, setPreview ] = useState< string >( '' );
	const [ currentLatex, setCurrentLatex ] = useState< string >( latex );
	const [ katexReady, setKatexReady ] = useState< boolean >( typeof window.katex !== 'undefined' );
	const textareaRef = useRef< HTMLTextAreaElement >();
	const props = useBlockProps( { className: 'jetpack-latex-formula is-editing' } );

	useEffect( () => {
		ensureKatexLoaded( () => setKatexReady( true ) );
	}, [] );

	useEffect( () => {
		if ( editing && isSelected && textareaRef.current ) {
			textareaRef.current.focus();
		}
	}, [ editing, isSelected ] );

	useEffect( () => {
		if ( ! katexReady ) {
			setPreview( __( 'Loading formula preview…', 'jetpack' ) );
			return;
		}
		try {
			const html =
				window.katex?.renderToString( currentLatex, {
					throwOnError: false,
					displayMode: true,
				} ) || '';
			setPreview( html );
		} catch {
			setPreview( __( 'Error rendering formula', 'jetpack' ) );
		}
	}, [ currentLatex, katexReady ] );

	if ( editing ) {
		return (
			<div { ...props }>
				<TextareaControl
					label={ __( 'LaTeX Code', 'jetpack' ) }
					ref={ textareaRef }
					value={ currentLatex }
					onChange={ ( next: string ) => setCurrentLatex( next ) }
					help={ __( 'Enter LaTeX math to render below. Example: \\frac{a}{b}', 'jetpack' ) }
					rows={ 4 }
					autoFocus
				/>
				<div className="jetpack-latex-formula-live-preview">
					{ katexReady ? (
						<div
							className="jetpack-latex-formula-rendered"
							dangerouslySetInnerHTML={ { __html: preview } }
						/>
					) : (
						<div className="jetpack-latex-formula-loading">
							{ __( 'Loading formula preview…', 'jetpack' ) }
						</div>
					) }
				</div>
				<div className="jetpack-latex-formula-save-btn-row">
					<Button
						variant="primary"
						onClick={ () => {
							setAttributes( { latex: currentLatex, editing: false } );
						} }
						className="jetpack-latex-formula-save-btn"
						disabled={ ! katexReady }
					>
						{ __( 'Done', 'jetpack' ) }
					</Button>
				</div>
			</div>
		);
	}

	// NOT editing: Immediately render the formula with KaTeX in-place (for a seamless editor experience)
	return (
		<div
			{ ...useBlockProps( { className: 'jetpack-latex-formula' } ) }
			tabIndex={ 0 }
			role="button"
			aria-label={ __( 'Edit LaTeX formula', 'jetpack' ) }
			onClick={ () => setAttributes( { editing: true } ) }
			data-latex={ latex }
		>
			{ katexReady ? (
				<span
					className="jetpack-latex-formula-rendered"
					dangerouslySetInnerHTML={ {
						__html: ( () => {
							try {
								return (
									window.katex?.renderToString( latex, {
										throwOnError: false,
										displayMode: true,
									} ) || ''
								);
							} catch {
								return __( 'Error rendering formula', 'jetpack' );
							}
						} )(),
					} }
				/>
			) : (
				<span className="jetpack-latex-formula-loading" style={ { color: '#888' } }>
					{ __( 'Loading…', 'jetpack' ) }
				</span>
			) }
		</div>
	);
}
