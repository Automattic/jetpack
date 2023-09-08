import { InnerBlocks } from '@wordpress/block-editor';
import './editor.scss';
function BlogrollItemEdit( { className, attributes } ) {
	const iconSize = 48;
	const { name, icon, url, description } = attributes;
	const innerBlocks = [
		[
			'core/columns',
			{},
			[
				[
					'core/column',
					{
						verticalAlignment: 'center',
						width: `${ iconSize }px`,
					},
					[
						[
							'core/image',
							{
								url: icon,
								width: `${ iconSize }px`,
								height: `${ iconSize }px`,
								style: { border: { radius: '50%' } },
							},
						],
					],
				],
				[
					'core/column',
					{},
					[
						[
							'core/paragraph',
							{
								style: {
									typography: { fontSize: '16px', fontStyle: 'normal', fontWeight: '500' },
									elements: { link: { color: { text: '#101517' } } },
								},
								content: `<a href="${ url }" target="_blank" rel="noopener noreferrer">${
									name || ''
								}</a>`,
							},
						],
						[
							'core/paragraph',
							{
								style: {
									spacing: { margin: { top: '2px' } },
									color: { text: '#646970' },
								},
								content: description,
							},
						],
					],
				],
			],
		],
	];

	return (
		<div className={ className }>
			<InnerBlocks template={ innerBlocks } />
		</div>
	);
}

export default BlogrollItemEdit;
