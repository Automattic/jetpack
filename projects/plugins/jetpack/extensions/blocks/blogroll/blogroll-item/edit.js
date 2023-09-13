import { InnerBlocks, RichText } from '@wordpress/block-editor';
import './editor.scss';
import { useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

function BlogrollItemEdit( { className, attributes, clientId, setAttributes } ) {
	const { icon, name, description } = attributes;
	const iconSize = 48;

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
		<div className={ className }>
			<InnerBlocks
				allowedBlocks={ [ 'core/image' ] }
				templateLock="all"
				template={ [
					[
						'core/image',
						{
							url: icon,
							width: iconSize,
							height: iconSize,
							style: { border: { radius: '50%' } },
						},
					],
				] }
			/>

			<div>
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
