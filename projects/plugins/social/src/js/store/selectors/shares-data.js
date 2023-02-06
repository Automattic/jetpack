const sharesDataSelectors = {
	getSharesCount: state =>
		( state.sharesData?.publicized_count ?? 0 ) + ( state.sharesData?.to_be_publicized_count ?? 0 ),
	getPostsCount: state => state.sharesData?.shared_posts_count ?? 0,
	isShareLimitEnabled: state => state.sharesData?.is_share_limit_enabled ?? false,
	numberOfSharesRemaining: state => state.sharesData?.shares_remaining ?? null,
};

export default sharesDataSelectors;
