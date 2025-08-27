import { useBlockProps } from '@wordpress/block-editor';
import {
	Button,
	TextareaControl,
	/* eslint-disable @wordpress/no-unsafe-wp-apis */
	__experimentalHStack as HStack,
	__experimentalSurface as Surface,
	__experimentalVStack as VStack,
	__experimentalText as Text,
	/* eslint-enable @wordpress/no-unsafe-wp-apis */
	Placeholder,
} from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useState, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import katex from 'katex';
import { icon } from './icon';
import './editor.scss';

const LatexPlaceholder = () => {
	return (
		<span className="jetpack-latex-rendered-placeholder">{ __( 'Write LaTeX…', 'jetpack' ) }</span>
	);
};

export default function Edit( { attributes, setAttributes, isSelected } ) {
	const { latex = '' } = attributes;
	const textareaRef = useRef();
	const [ renderAreaRef, setRenderAreaRef ] = useState( null );
	const dispatch = useDispatch();
	const blockProps = useBlockProps();
	const { style, ...props } = blockProps;

	useEffect( () => {
		if ( renderAreaRef ) {
			katex.render( latex, renderAreaRef, {
				throwOnError: false,
				displayMode: false,
				output: 'mathml',
			} );
		}
	}, [ latex, renderAreaRef ] );

	if ( isSelected ) {
		return (
			<div { ...props }>
				<Placeholder label={ __( 'LaTeX', 'jetpack' ) } icon={ icon }>
					<VStack
						className="jetpack-latex-textarea-container"
						gap={ 4 }
						justify="flex-start"
						align="stretch"
					>
						<TextareaControl
							label={ __( 'LaTeX code', 'jetpack' ) }
							className="jetpack-latex-textarea"
							ref={ textareaRef }
							value={ latex }
							onChange={ value => setAttributes( { latex: value } ) }
							rows={ 4 }
							help={
								/* translators: \frac{a}{b} is an example of LaTeX code. Should stay as is. */
								__( 'Example: \\frac{a}{b}', 'jetpack' )
							}
						/>

						<Text upperCase>{ __( 'Preview', 'jetpack' ) }</Text>
						<Surface variant="secondary" className="jetpack-latex-rendered-container">
							{ latex.trim() ? (
								<div
									className="jetpack-latex-rendered"
									style={ style }
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
			{ ...blockProps }
			tabIndex={ 0 }
			role="button"
			aria-label={ __( 'Edit LaTeX', 'jetpack' ) }
			data-latex={ latex }
		>
			<Surface variant="secondary" className="jetpack-latex-rendered-container">
				{ latex.trim() ? (
					<div
						className="jetpack-latex-rendered"
						style={ style }
						ref={ r => r !== renderAreaRef && setRenderAreaRef( r ) }
					/>
				) : (
					<LatexPlaceholder />
				) }
			</Surface>
		</div>
	);
}
