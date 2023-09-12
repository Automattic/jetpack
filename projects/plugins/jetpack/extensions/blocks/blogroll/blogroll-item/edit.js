import { InnerBlocks } from '@wordpress/block-editor';
import { useEffect } from '@wordpress/element';
import SubscribeButton from './subscribe-button';

import './editor.scss';

function Edit( { className, attributes, setAttributes, context } ) {
	const iconSize = 48;
	const { name, icon, url, description, subscribe } = attributes;
	const { showSubscribeButton } = context;

	useEffect( () => {
		setAttributes( { subscribe: showSubscribeButton } );
	}, [ setAttributes, showSubscribeButton ] );

	const DEFAULT_TEMPLATE = [
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
								width: iconSize,
								height: iconSize,
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
			<InnerBlocks template={ DEFAULT_TEMPLATE } templateLock="all" />
			{ subscribe && <SubscribeButton siteId={ attributes.id } /> }
		</div>
	);
}

export default Edit;
