import {
	RichText,
	MediaUpload,
	useBlockProps,
	InspectorAdvancedControls,
} from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { InputControl } from '@wordpress/ui';
import './editor.scss';

function BlogrollItemEdit( { className, attributes, setAttributes } ) {
	const { icon, name, description, feed_url } = attributes;
	const blockProps = useBlockProps( { className } );

	return (
		<>
			<InspectorAdvancedControls>
				<InputControl
					type="url"
					label={ __( 'Feed URL', 'jetpack' ) }
					description={ __(
						'The RSS or Atom feed for this site, for use in a future OPML export.',
						'jetpack'
					) }
					value={ feed_url ?? '' }
					onValueChange={ value => setAttributes( { feed_url: value || undefined } ) }
					placeholder={ __( 'https://example.com/feed/', 'jetpack' ) }
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
