import {
	RichText,
	MediaUpload,
	useBlockProps,
	InspectorAdvancedControls,
} from '@wordpress/block-editor';
import { Button, TextControl } from '@wordpress/components';
import './editor.scss';
import { __ } from '@wordpress/i18n';

function BlogrollItemEdit( { className, attributes, setAttributes } ) {
	const { icon, name, description, feed_url } = attributes;
	const blockProps = useBlockProps( { className } );

	return (
		<>
			<InspectorAdvancedControls>
				<TextControl
					type="url"
					label={ __( 'Feed URL', 'jetpack' ) }
					help={ __(
						'The RSS or Atom feed for this site. Visitors can use this link to subscribe in a feed reader.',
						'jetpack'
					) }
					value={ feed_url ?? '' }
					onChange={ value => setAttributes( { feed_url: value || undefined } ) }
					placeholder={ __( 'https://example.com/feed/', 'jetpack' ) }
					__nextHasNoMarginBottom={ true }
					__next40pxDefaultSize={ true }
				/>
			</InspectorAdvancedControls>
			<hr className="wp-block-separator jetpack-blogroll-item-divider" />
			<div { ...blockProps }>
				<MediaUpload
					multiple={ false }
					onSelect={ media => {
						setAttributes( { icon: media.url } );
					} }
					render={ ( { open } ) => (
						<Button variant="link" onClick={ open } style={ { padding: 0 } }>
							<figure>
								<img
									className="blogroll-item-image"
									onError={ event => {
										event.target.parentNode.classList.add( 'empty-site-icon' );
									} }
									src={ icon }
									alt={ name }
								/>
							</figure>
						</Button>
					) }
				/>
				<div className="jetpack-blogroll-item-content">
					<a>
						<RichText
							className="jetpack-blogroll-item-title"
							value={ name }
							tagName={ 'p' }
							allowedFormats={ [ 'core/italic' ] }
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
		</>
	);
}

export default BlogrollItemEdit;
