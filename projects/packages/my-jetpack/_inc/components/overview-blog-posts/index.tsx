import { dateI18n, getSettings } from '@wordpress/date';
import { __ } from '@wordpress/i18n';
import { tip } from '@wordpress/icons';
import { Link, Stack, Text } from '@wordpress/ui';
import { QUERY_BLOG_POSTS_KEY, REST_API_BLOG_POSTS_ENDPOINT } from '../../data/constants';
import useSimpleQuery from '../../data/use-simple-query';
import OverviewSection from '../product-cards-section/overview-section';
import styles from './style.module.scss';
import type { FC } from 'react';

type BlogPost = {
	title: string;
	link: string;
	date: string | null;
};

/**
 * Recent posts from the Jetpack.com blog. Renders nothing until they load, or if none do.
 *
 * @return The section, or null.
 */
const OverviewBlogPosts: FC = () => {
	const { data: posts } = useSimpleQuery< BlogPost[] >( {
		name: QUERY_BLOG_POSTS_KEY,
		query: { path: REST_API_BLOG_POSTS_ENDPOINT },
	} );

	if ( ! posts?.length ) {
		return null;
	}

	const dateFormat = getSettings().formats.date;

	return (
		<OverviewSection icon={ tip } title={ __( 'What’s new in Jetpack?', 'jetpack-my-jetpack' ) }>
			<Stack direction="column" gap="md" render={ <ul className={ styles.list } /> }>
				{ posts.map( post => (
					<Stack direction="column" gap="xs" render={ <li /> } key={ post.link }>
						<Link href={ post.link } openInNewTab>
							{ post.title }
						</Link>
						{ post.date && (
							<Text variant="body-sm" render={ <time dateTime={ post.date } /> }>
								{ dateI18n( dateFormat, post.date, undefined ) }
							</Text>
						) }
					</Stack>
				) ) }
			</Stack>
		</OverviewSection>
	);
};

export default OverviewBlogPosts;
