const SubscribeButton = ( { siteId } ) => {
	return (
		<a
			className="wp-block-jetpack-blogroll-item__subscribe-button wp-block-button__link"
			id={ siteId ? `site-id-${ siteId }` : undefined }
		>
			Subscribe
		</a>
	);
};

export default SubscribeButton;
