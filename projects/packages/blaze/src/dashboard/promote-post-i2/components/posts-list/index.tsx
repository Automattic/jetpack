import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { EmptyState, Link, Notice } from '@wordpress/ui';
import { useState } from 'react';
import config from '../../../compat/config';
import { APIError } from '../../../compat/state';
import { CALYPSO_CONTACT } from '../../../compat/utils';
import { BlazablePost } from '../../../data/promote-post/types';
import { useInfiniteScroll } from '../../../data/promote-post/use-infinite-scroll';
import { DSPMessage } from '../../main';
import './style.scss';
import PostsTable from '../posts-table';
import SearchBar, { SearchOptions } from '../search-bar';

type Props = {
	isLoading: boolean;
	isError: DSPMessage | null;
	isFetching: boolean;
	fetchNextPage: () => void;
	handleSearchOptions: ( search: SearchOptions ) => void;
	totalCampaigns: number;
	hasMorePages: boolean;
	posts?: BlazablePost[];
	hasPaymentsBlocked: boolean;
};

const ERROR_NO_LOCAL_USER = 'no_local_user';
const ERROR_POSTS_NOT_READY = 'posts_not_ready';

const fetchErrorListMessage = () =>
	createInterpolateElement(
		/* translators: Validation error when filling out domain checkout contact details form */ __(
			'There was a problem obtaining the posts list. Please try again or <contactSupportLink>contact support</contactSupportLink>.',
			'jetpack-blaze'
		),
		{
			contactSupportLink: <Link href={ CALYPSO_CONTACT } />,
		}
	);

export const postsNotReadyErrorMessage = () =>
	sprintf(
		/* translators: Error shown while the posts are still syncing. %(productName)s is the product name, Blaze Ads. */ __(
			'%(productName)s is syncing your content as part of first-time setup – this can take up to 15 minutes or a few hours.',
			'jetpack-blaze'
		),
		{ productName: 'Blaze Ads' }
	);

/**
 *
 * @param props
 */
export default function PostsList( props: Props ) {
	const isWooStore = config.isEnabled( 'is_running_in_woo_site' );
	const initialPostType = isWooStore ? 'product' : '';
	const [ postType, setPostType ] = useState( initialPostType );
	const {
		isLoading,
		isError,
		isFetching,
		fetchNextPage,
		handleSearchOptions,
		totalCampaigns,
		hasMorePages,
		posts,
		hasPaymentsBlocked,
	} = props;

	const hasLocalUser = ( isError as DSPMessage )?.errorCode !== ERROR_NO_LOCAL_USER;
	const hasPostsNotReadyError = ( isError as APIError )?.code === ERROR_POSTS_NOT_READY;

	const { containerRef } = useInfiniteScroll( {
		offset: '200px',
		shouldStop: ! hasMorePages || isLoading || isFetching,
		async onLoadMore() {
			await fetchNextPage();
		},
	} );

	const onChangeFilter = ( postType: string ) => {
		setPostType( postType );
	};

	if ( isError && hasPostsNotReadyError ) {
		return (
			<Notice.Root intent="info" className="promote-post-notice promote-post-i2__aux-wrapper">
				<Notice.Description>{ postsNotReadyErrorMessage() }</Notice.Description>
			</Notice.Root>
		);
	}

	if ( isError && hasLocalUser ) {
		return (
			<Notice.Root intent="error" className="promote-post-notice promote-post-i2__aux-wrapper">
				<Notice.Description>{ fetchErrorListMessage() }</Notice.Description>
			</Notice.Root>
		);
	}

	return (
		<>
			<SearchBar
				mode="posts"
				handleSetSearch={ search => handleSearchOptions( search ) }
				postType={ postType }
				handleFilterPostTypeChange={ onChangeFilter }
			/>
			{ ! isLoading && posts?.length === 0 ? (
				<div className="promote-post-i2__aux-wrapper">
					{ totalCampaigns === 0 ? (
						<EmptyState.Root className="promote-post-i2__empty-content">
							<EmptyState.Title>
								{ __( 'You have no content to promote.', 'jetpack-blaze' ) }
							</EmptyState.Title>
							<EmptyState.Description>
								{ __(
									'You have not published any posts, pages or products yet. Make sure your content is published and come back to promote it.',
									'jetpack-blaze'
								) }
							</EmptyState.Description>
						</EmptyState.Root>
					) : (
						<>{ __( 'No posts match your search', 'jetpack-blaze' ) }</>
					) }
				</div>
			) : (
				<>
					<div ref={ containerRef }>
						{ posts && (
							<PostsTable
								posts={ posts }
								isLoading={ isLoading }
								isFetchingPageResults={ isFetching }
								type={ postType }
								hasPaymentsBlocked={ hasPaymentsBlocked }
							/>
						) }
					</div>
				</>
			) }
		</>
	);
}
