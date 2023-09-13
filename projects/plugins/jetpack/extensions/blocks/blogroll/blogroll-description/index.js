import { InnerBlocks, useInnerBlocksProps } from '@wordpress/block-editor';
import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { getIconColor } from '../../../shared/block-icons';

registerBlockType( 'jetpack/blogroll-description', {
	title: __( 'Blogroll Description', 'jetpack' ),
	icon: {
		src: 'text',
		foreground: getIconColor(),
	},
	parent: [ 'blogroll-item' ],
	supports: {
		color: {
			background: true,
			link: true,
			text: true,
		},
		typography: {
			fontSize: true,
			lineHeight: true,
		},
		inserter: false,
	},
	usesContext: [ 'description' ],

	edit: ( { context, className } ) => {
		return (
			<div className={ className }>
				<InnerBlocks
					allowedBlocks={ [ 'core/paragraph' ] }
					template={ [
						[
							'core/paragraph',
							{
								style: {
									spacing: {
										margin: { top: '2px', bottom: 0, left: 0, right: 0 },
										padding: { top: 0, bottom: 0, left: 0, right: 0 },
									},
									color: { text: '#646970' },
								},
								content: context?.description,
							},
						],
					] }
				/>
			</div>
		);
	},

	save: () => {
		return <div { ...useInnerBlocksProps.save() } />;
	},
} );
