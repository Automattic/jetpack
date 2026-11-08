import { __, _x } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import { useId } from 'react';
import styles from './styles.module.scss';

const IMAGE_BASE = 'https://jetpackme.files.wordpress.com/2019/03/';

const ITEMS = [
	{
		image: 'cat-blog.png',
		title: __( 'Big iPhone/iPad Update Now Available', 'jetpack-my-jetpack' ),
		context: _x(
			'In "Mobile"',
			'It refers to the category where a post was found. Used in an example preview.',
			'jetpack-my-jetpack'
		),
	},
	{
		image: 'devices.jpg',
		title: __( 'The WordPress for Android App Gets a Big Facelift', 'jetpack-my-jetpack' ),
		context: _x(
			'In "Mobile"',
			'It refers to the category where a post was found. Used in an example preview.',
			'jetpack-my-jetpack'
		),
	},
	{
		image: 'mobile-wedding.jpg',
		title: __( 'Upgrade Focus: VideoPress For Weddings', 'jetpack-my-jetpack' ),
		context: _x(
			'In "Upgrade"',
			'It refers to the category where a post was found. Used in an example preview.',
			'jetpack-my-jetpack'
		),
	},
];

type RelatedPostsPreviewProps = {
	showHeadline: boolean;
	showThumbnails: boolean;
};

/**
 * A mock of how related posts look under a post, following the two display options.
 *
 * @param props                - Component props.
 * @param props.showHeadline   - Whether the "Related" heading shows.
 * @param props.showThumbnails - Whether each item shows its image.
 * @return The preview.
 */
export function RelatedPostsPreview( { showHeadline, showThumbnails }: RelatedPostsPreviewProps ) {
	const labelId = useId();

	return (
		<Stack direction="column" gap="sm">
			<Text variant="body-md" id={ labelId }>
				{ _x(
					'Preview',
					'A header for a preview area in the configuration screen.',
					'jetpack-my-jetpack'
				) }
			</Text>
			<div className={ styles[ 'related-posts-preview' ] } role="group" aria-labelledby={ labelId }>
				{ showHeadline && (
					<Text variant="body-sm" className={ styles[ 'related-posts-preview__headline' ] }>
						{ __( 'Related', 'jetpack-my-jetpack' ) }
					</Text>
				) }
				<ul className={ styles[ 'related-posts-preview__list' ] }>
					{ ITEMS.map( item => (
						<li key={ item.image } className={ styles[ 'related-posts-preview__item' ] }>
							{ showThumbnails && (
								<img
									className={ styles[ 'related-posts-preview__image' ] }
									src={ IMAGE_BASE + item.image }
									alt=""
								/>
							) }
							<Text variant="body-sm" className={ styles[ 'related-posts-preview__title' ] }>
								{ item.title }
							</Text>
							<Text variant="body-sm" className={ styles[ 'related-posts-preview__context' ] }>
								{ item.context }
							</Text>
						</li>
					) ) }
				</ul>
			</div>
		</Stack>
	);
}
