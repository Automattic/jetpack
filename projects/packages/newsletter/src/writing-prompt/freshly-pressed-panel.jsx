import analytics from '@automattic/jetpack-analytics';
import { useCallback } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { Link, Stack, Text } from '@wordpress/ui';

/**
 * One Freshly Pressed post, linking to the WordPress.com Reader.
 *
 * @param {object} props          - Component props.
 * @param {object} props.post     - The post, as prepared by `Freshly_Pressed::get_posts()`.
 * @param {number} props.position - Where the post sits in the list, for analytics.
 * @param {string} props.siteType - The site type, for analytics.
 * @return {import('react').ReactElement} The post link.
 */
const FreshlyPressedPost = ( { post, position, siteType } ) => {
	const recordClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_newsletter_writing_prompt_freshly_pressed_post_click', {
			site_type: siteType,
			blog_id: post.blog_id,
			post_id: post.post_id,
			position,
		} );
	}, [ post, position, siteType ] );

	return (
		<Link
			tone="neutral"
			href={ post.permalink }
			openInNewTab
			rel="noreferrer noopener"
			onClick={ recordClick }
		>
			{ decodeEntities( post.title ) }
		</Link>
	);
};

/**
 * The Freshly Pressed view: the posts WordPress.com is currently featuring.
 *
 * @param {object}   props          - Component props.
 * @param {object[]} props.posts    - The featured posts, as prepared by `Freshly_Pressed::get_posts()`.
 * @param {string}   props.siteType - The site type, for analytics.
 * @return {import('react').ReactElement} The Freshly Pressed panel.
 */
export default ( { posts, siteType } ) => (
	<Stack direction="column" gap="sm">
		<Text
			className="wpcom-daily-writing-prompt--freshly-pressed-intro"
			variant="body-sm"
			render={ <p /> }
		>
			{ __( "Freshly Pressed highlights our team's favorite blog posts.", 'jetpack-newsletter' ) }
		</Text>
		<ul
			className="wpcom-daily-writing-prompt--freshly-pressed-list"
			aria-label={ __( 'Freshly Pressed posts', 'jetpack-newsletter' ) }
		>
			{ posts.map( ( post, position ) => (
				<li key={ post.permalink }>
					<FreshlyPressedPost post={ post } position={ position } siteType={ siteType } />
				</li>
			) ) }
		</ul>
	</Stack>
);
