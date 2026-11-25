import { humanTimeDiff } from '@wordpress/date';
import { __ } from '@wordpress/i18n';
import { tip } from '@wordpress/icons';
import { Link, Stack, Text } from '@wordpress/ui';
import clsx from 'clsx';
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
	excerpt_is_automatic: boolean;
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
				<ul className={ styles.list }>
					{ posts.map( post => (
						<li className={ styles.post } key={ post.link }>
							{ post.thumbnail ? (
								<img className={ styles.thumbnail } src={ post.thumbnail } alt="" loading="lazy" />
							) : (
								<span className={ clsx( styles.thumbnail, styles[ 'thumbnail--empty' ] ) } />
							) }
							<Stack direction="column" gap="xs" className={ styles.text }>
								<Text variant="heading-md" className={ styles.title } render={ <div /> }>
									<Link
										href={ post.link }
										openInNewTab
										tone="neutral"
										variant="unstyled"
										className={ styles.link }
									>
										{ post.title }
									</Link>
								</Text>
								{ post.excerpt && (
									<Text
										variant="body-sm"
										className={ clsx( styles.muted, styles.excerpt, {
											[ styles[ 'excerpt--automatic' ] ]: post.excerpt_is_automatic,
										} ) }
									>
										{ post.excerpt }
									</Text>
								) }
								{ post.date && (
									<Text
										variant="body-sm"
										className={ styles.muted }
										render={ <time dateTime={ post.date } /> }
									>
										{ humanTimeDiff( post.date ) }
									</Text>
								) }
							</Stack>
						</li>
					) ) }
				</ul>
				<Link href="https://jetpack.com/resources/" openInNewTab>
					{ __( 'See all Jetpack news', 'jetpack-my-jetpack' ) }
				</Link>
			</Stack>
		</OverviewSection>
	);
};

export default OverviewBlogPosts;
