import { useBlockProps } from '@wordpress/block-editor';
import {
	Button,
	TextareaControl,
	/* eslint-disable @wordpress/no-unsafe-wp-apis */
	__experimentalHStack as HStack,
	__experimentalSurface as Surface,
	__experimentalVStack as VStack,
	/* eslint-enable @wordpress/no-unsafe-wp-apis */
	Placeholder,
} from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useState, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import katex from 'katex';
import { icon } from './icon';
import 'katex/dist/katex.min.css';
import './editor.scss';

const LatexPlaceholder = () => {
	return (
		<span className="jetpack-latex-rendered-placeholder">{ __( 'Write LaTex…', 'jetpack' ) }</span>
	);
};

export default function Edit( { attributes, setAttributes, isSelected } ) {
	const { latex = '' } = attributes;
	const textareaRef = useRef();
	const [ renderAreaRef, setRenderAreaRef ] = useState( null );
	const dispatch = useDispatch();
	const props = useBlockProps( { className: 'jetpack-latex' } );

	useEffect( () => {
		if ( renderAreaRef ) {
			katex.render( latex, renderAreaRef, {
				throwOnError: false,
				displayMode: false,
				output: 'html',
			} );
		}
	}, [ latex, renderAreaRef ] );

	if ( isSelected ) {
		return (
			<div { ...props }>
				<Placeholder
					label={ __( 'LaTeX Block', 'jetpack' ) }
					instructions={ __( 'Enter LaTeX code below', 'jetpack' ) }
					icon={ icon }
				>
					<VStack gap={ 4 } justify="flex-start" align="stretch">
						<TextareaControl
							__nextHasNoMarginBottom
							label={ __( 'LaTeX Code', 'jetpack' ) }
							ref={ textareaRef }
							value={ latex }
							onChange={ value => setAttributes( { latex: value } ) }
							help={ __( 'Example: \\frac{a}{b}', 'jetpack' ) }
							rows={ 4 }
						/>

						<Surface variant="secondary" className="jetpack-latex-rendered-container">
							{ latex.trim() ? (
								<span
									className="jetpack-latex-rendered"
									ref={ r => r !== renderAreaRef && setRenderAreaRef( r ) }
								/>
							) : (
								<LatexPlaceholder />
							) }
						</Surface>
					</VStack>
					<HStack justify="flex-end">
						<Button
							__next40pxDefaultSize
							variant="primary"
							onClick={ () => {
								setAttributes( { latex } );
								dispatch( 'core/block-editor' ).clearSelectedBlock();
							} }
						>
							{ __( 'Done', 'jetpack' ) }
						</Button>
					</HStack>
				</Placeholder>
			</div>
		);
	}

	return (
		<div
			{ ...props }
			tabIndex={ 0 }
			role="button"
			aria-label={ __( 'Edit LaTex', 'jetpack' ) }
			data-latex={ latex }
		>
			<Surface variant="secondary" className="jetpack-latex-rendered-container">
				{ latex.trim() ? (
					<span
						className="jetpack-latex-rendered"
						ref={ r => r !== renderAreaRef && setRenderAreaRef( r ) }
					/>
				) : (
					<LatexPlaceholder />
				) }
			</Surface>
		</div>
	);
}
