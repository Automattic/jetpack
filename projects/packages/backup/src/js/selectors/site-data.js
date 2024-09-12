const siteDataSelectors = {
	getSiteData: state => state.siteData || [],
	getSiteTitle: state => state.siteData?.title || '',
	getBlogId: state => state.siteData?.id || null,
};

export default siteDataSelectors;
