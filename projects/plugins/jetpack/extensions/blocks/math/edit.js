import { useBlockProps } from '@wordpress/block-editor';
import {
	Button,
	TextareaControl,
	/* eslint-disable @wordpress/no-unsafe-wp-apis */
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalText as Text,
	/* eslint-enable @wordpress/no-unsafe-wp-apis */
	Placeholder,
} from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useState, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { icon } from './icon';
import 'katex/dist/katex.min.css';
import './editor.scss';
import { renderMath } from './utils';

const LatexPlaceholder = () => {
	return (
		<span className="jetpack-math-rendered-placeholder">{ __( 'Write math…', 'jetpack' ) }</span>
	);
};

export default function Edit( { attributes, setAttributes, isSelected } ) {
	const { source = '' } = attributes;
	const textareaRef = useRef();
	const [ renderAreaRef, setRenderAreaRef ] = useState( null );
	const dispatch = useDispatch();
	const blockProps = useBlockProps();
	const { style, ...props } = blockProps;

	useEffect( () => {
		if ( renderAreaRef ) {
			renderAreaRef.innerHTML = renderMath( source );
		}
	}, [ source, renderAreaRef ] );

	if ( isSelected ) {
		return (
			<div { ...props }>
				<Placeholder label={ __( 'Math', 'jetpack' ) } icon={ icon }>
					<VStack
						className="jetpack-math-textarea-container"
						gap={ 4 }
						justify="flex-start"
						align="stretch"
					>
						<TextareaControl
							label={ __( 'Math code (Tex or MathML)', 'jetpack' ) }
							className="jetpack-math-textarea"
							ref={ textareaRef }
							value={ source }
							onChange={ value => setAttributes( { source: value } ) }
							rows={ 4 }
							help={ __( 'To render MathML your code must be wrapped in <math> tags.', 'jetpack' ) }
						/>
						<Text upperCase>{ __( 'Preview', 'jetpack' ) }</Text>
						{ source.trim() && (
							<div
								className="jetpack-math-rendered"
								style={ style }
								ref={ r => r !== renderAreaRef && setRenderAreaRef( r ) }
							/>
						) }
					</VStack>
					<HStack justify="flex-end">
						<Button
							__next40pxDefaultSize
							variant="primary"
							onClick={ () => {
								setAttributes( { source } );
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
			aria-label={ __( 'Edit math', 'jetpack' ) }
			data-source={ source }
		>
			{ source.trim() ? (
				<div
					className="jetpack-math-rendered"
					ref={ r => r !== renderAreaRef && setRenderAreaRef( r ) }
				/>
			) : (
				<LatexPlaceholder />
			) }
		</div>
	);
}
