const sharesDataSelectors = {
	getSharesCount: state => {
		return (
			( state.sharesData?.publicized_count || 0 ) +
			( state.sharesData?.to_be_publicized_count || 0 )
		);
	},
	isShareLimitEnabled: state => {
		return state.sharesData?.is_share_limit_enabled || false;
	},
};

export default sharesDataSelectors;
