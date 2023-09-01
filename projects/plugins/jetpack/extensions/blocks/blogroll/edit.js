import { InspectorControls, useBlockProps, InnerBlocks } from '@wordpress/block-editor';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import './editor.scss';

export function BlogRollEdit( { className, attributes, setAttributes } ) {
	const {
		show_avatar,
		show_description,
		show_subscribe_button,
		open_links_new_window,
		ignore_user_blogs,
	} = attributes;

	const DEFAULT_TEMPLATE = [ [ 'jetpack/blogroll-item', {} ] ];
	const ALLOWED_BLOCKS = [ 'jetpack/blogroll-item' ];

	return (
		<div { ...useBlockProps() } className={ className }>
			<InnerBlocks template={ DEFAULT_TEMPLATE } allowedBlocks={ ALLOWED_BLOCKS } />

			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'jetpack' ) }>
					<ToggleControl
						label={ __( 'Show avatar', 'jetpack' ) }
						checked={ !! show_avatar }
						onChange={ () => setAttributes( { show_avatar: ! show_avatar } ) }
					/>
					<ToggleControl
						label={ __( 'Show description', 'jetpack' ) }
						checked={ !! show_description }
						onChange={ () => setAttributes( { show_description: ! show_description } ) }
					/>
					<ToggleControl
						label={ __( 'Show subscribe button', 'jetpack' ) }
						checked={ !! show_subscribe_button }
						onChange={ () => setAttributes( { show_subscribe_button: ! show_subscribe_button } ) }
					/>
					<ToggleControl
						label={ __( 'Open links in a new window', 'jetpack' ) }
						checked={ !! open_links_new_window }
						onChange={ () => setAttributes( { open_links_new_window: ! open_links_new_window } ) }
					/>
					<ToggleControl
						label={ __( 'Hide my own sites', 'jetpack' ) }
						checked={ !! ignore_user_blogs }
						onChange={ () => setAttributes( { ignore_user_blogs: ! ignore_user_blogs } ) }
					/>
				</PanelBody>
			</InspectorControls>
		</div>
	);
}

export default BlogRollEdit;
