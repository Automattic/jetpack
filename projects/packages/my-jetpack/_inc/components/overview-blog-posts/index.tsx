import { humanTimeDiff } from '@wordpress/date';
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
	excerpt: string;
	thumbnail: string | null;
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
		options: { refetchOnMount: false },
	} );

	if ( ! posts?.length ) {
		return null;
	}

	return (
		<OverviewSection icon={ tip } title={ __( 'What’s new in Jetpack?', 'jetpack-my-jetpack' ) }>
			<Stack direction="column" gap="lg" align="start">
				<Stack direction="column" gap="lg" render={ <ul className={ styles.list } /> }>
					{ posts.map( post => (
						<Stack direction="row" gap="md" align="center" render={ <li /> } key={ post.link }>
							{ post.thumbnail && (
								<img className={ styles.thumbnail } src={ post.thumbnail } alt="" loading="lazy" />
							) }
							<Stack direction="column" gap="xs">
								{ post.date && (
									<Text
										variant="body-sm"
										className={ styles.muted }
										render={ <time dateTime={ post.date } /> }
									>
										{ humanTimeDiff( post.date ) }
									</Text>
								) }
								<Link href={ post.link } openInNewTab tone="neutral" variant="unstyled">
									<Text variant="body-md">{ post.title }</Text>
								</Link>
								{ post.excerpt && (
									<Text variant="body-sm" className={ styles.muted }>
										{ post.excerpt }
									</Text>
								) }
							</Stack>
						</Stack>
					) ) }
				</Stack>
				<Link href="https://jetpack.com/resources/" openInNewTab>
					{ __( 'Read more', 'jetpack-my-jetpack' ) }
				</Link>
			</Stack>
		</OverviewSection>
	);
};

export default OverviewBlogPosts;
