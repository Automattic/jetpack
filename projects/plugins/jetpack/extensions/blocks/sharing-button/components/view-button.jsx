import SocialIcon from 'social-logos';

const mountLink = () => {
	return '';
};

const ViewSocialButton = ( { service, post } ) => {
	return (
		<a
			rel="nofollow noopener noreferrer"
			className={ `jetpack-sharing-button__button share-${ service }` }
			href={ mountLink( service, post ) }
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
