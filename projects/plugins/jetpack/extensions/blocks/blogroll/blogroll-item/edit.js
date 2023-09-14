import { RichText, MediaUpload, useBlockProps } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import './editor.scss';
import { useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

function BlogrollItemEdit( { className, attributes, clientId, setAttributes } ) {
	const { icon, name, description } = attributes;
	const blockProps = useBlockProps( { className } );

	const imageUrl = useSelect(
		select => {
			const innerBlocks = select( 'core/block-editor' ).getBlock( clientId )?.innerBlocks;
			return innerBlocks[ 0 ]?.attributes?.url;
		},
		[ clientId ]
	);

	useEffect( () => {
		if ( imageUrl !== undefined ) {
			setAttributes( { icon: imageUrl } );
		}
	}, [ imageUrl, setAttributes ] );

	return (
		<div { ...blockProps }>
			<MediaUpload
				multiple={ false }
				onSelect={ media => {
					setAttributes( { icon: media.url } );
				} }
				render={ ( { open } ) => (
					<Button variant="link" onClick={ open } style={ { padding: 0 } }>
						<figure>
							<img src={ icon } alt={ name } />
						</figure>
					</Button>
				) }
			/>
			<div>
				<a>
					<RichText
						className="jetpack-blogroll-item-title"
						value={ name }
						tagName={ 'h3' }
						allowedFormats={ [ 'core/bold', 'core/italic' ] }
						onChange={ value => {
							setAttributes( { name: value } );
						} }
						placeholder={ __( 'Enter site title', 'jetpack' ) }
					/>
				</a>
				<RichText
					className="jetpack-blogroll-item-description"
					value={ description }
					onChange={ value => {
						setAttributes( { description: value } );
					} }
					placeholder={ __( 'Enter site description', 'jetpack' ) }
				/>
			</div>
		</div>
	);
}

export default BlogrollItemEdit;
