import { InnerBlocks } from '@wordpress/block-editor';
import './editor.scss';
import '../blogroll-name';
import '../blogroll-description';

function BlogrollItemEdit( { className, attributes } ) {
	const iconSize = 48;
	const { icon } = attributes;

	const innerBlocks = [
		[
			'core/group',
			{
				layout: { type: 'flex', flexWrap: 'nowrap' },
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
				[ 'core/group', {}, [ [ 'jetpack/blogroll-name' ], [ 'jetpack/blogroll-description' ] ] ],
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
