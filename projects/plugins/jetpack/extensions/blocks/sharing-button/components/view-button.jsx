import SocialIcon from 'social-logos';

const ViewSocialButton = ( { service, url } ) => {
	return (
		<a
			rel="nofollow noopener noreferrer"
			className={ `jetpack-sharing-button__button share-${ service }` }
			href={ url }
			target="_blank"
			data-shared={ `sharing-${ service }-` }
			primary
		>
			<SocialIcon icon={ service } size={ 24 } />
			<span className="jetpack-sharing-buttons__service-label">{ service }</span>
		</a>
	);
};

ViewSocialButton.defaultProps = {
	service: '',
	post: {},
};

export default ViewSocialButton;
