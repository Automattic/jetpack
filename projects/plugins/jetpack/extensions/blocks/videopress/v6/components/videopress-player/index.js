/**
 * External dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';
import { ResizableBox, SandBox } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';

export default function VideoPressPlayer( {
	html,
	caption,
	isSelected,
	attributes,
	setAttributes,
	scripts = [],
} ) {
	// @todo: implemen maxWidth
	const { align, maxWidth } = attributes;

	const blockProps = useBlockProps( {
		className: classNames( 'wp-block-jetpack-videopress', {
			[ `align${ align }` ]: align,
		} ),
	} );

	const onBlockResize = useCallback(
		( event, direction, domElement ) => {
			let newMaxWidth = getComputedStyle( domElement ).width;
			const parentElement = domElement.parentElement;
			if ( null !== parentElement ) {
				const parentWidth = getComputedStyle( domElement.parentElement ).width;
				if ( newMaxWidth === parentWidth ) {
					newMaxWidth = '100%';
				}
			}

			setAttributes( { maxWidth: newMaxWidth } );
		},
		[ setAttributes ]
	);

	// Populate scripts array with videopresAjaxURLBlob blobal var.
	if ( window.videopressAjax ) {
		const videopresAjaxURLBlob = new Blob(
			[ `var videopressAjax = ${ JSON.stringify( window.videopressAjax ) };` ],
			{
				type: 'text/javascript',
			}
		);

		scripts.push( URL.createObjectURL( videopresAjaxURLBlob ), window.videopressAjax.bridgeUrl );
	}

	return (
		<figure { ...blockProps }>
			<ResizableBox
				enable={ {
					top: false,
					bottom: false,
					left: true,
					right: true,
				} }
				maxWidth="100%"
				size={ { width: maxWidth } }
				style={ { margin: 'auto' } }
				onResizeStop={ onBlockResize }
			>
				<SandBox html={ html } scripts={ scripts } />
			</ResizableBox>

			{ ( ! RichText.isEmpty( caption ) || isSelected ) && (
				<RichText
					tagName="figcaption"
					placeholder={ __( 'Write caption…', 'jetpack' ) }
					value={ caption }
					onChange={ value => setAttributes( { caption: value } ) }
					inlineToolbar
				/>
			) }
		</figure>
	);
}
