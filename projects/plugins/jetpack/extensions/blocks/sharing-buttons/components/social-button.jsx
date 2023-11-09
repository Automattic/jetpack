// import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import SocialIcon from 'social-logos';
import availableServices from '../available-services';

const mountLink = ( service, post ) => {
	if ( 'email' === service ) {
		return addQueryArgs( 'mailto:', {
			subject: `Shared post: ${ post.title }`,
			// subject: __( `Shared post: ${ post.title }`, 'jetpack' ),
			body: post.link,
		} );
	}
	return addQueryArgs( post.link, {
		share: service,
		nb: 1,
	} );
};

// const SocialButton = ({ service, post }) => {
// 	return (
// 		<a
// 			className={`sd-button share-icon share-${service}`}
// 			rel="nofollow noopener noreferrer"
// 			shared={`sharing-${service}-1`}
// 			target="_blank"
// 			title={__(sprintf('Click to share on %s', availableServices[service].label), 'jetpack')}
// 			href={mountLink(service, post)}
// 			primary
// 		>
// 			{availableServices[service].label}
// 		</a>
// 	);
// };

const SocialButton = ( { service, post } ) => {
	return (
		<a
			rel="nofollow noopener noreferrer"
			className={ `jetpack-sharing-buttons__share-button share-${ service }` }
			href={ mountLink( service, post ) }
			target="_blank"
			data-shared={ `sharing-${ service }-${ post?.id }` }
			primary
		>
			<SocialIcon icon={ availableServices[ service ].icon } size={ 24 } />
			<span className="jetpack-sharing-buttons__service-label">
				{ availableServices[ service ].label }
			</span>
		</a>
	);
};

SocialButton.defaultProps = {
	service: '',
	post: {},
};

export default SocialButton;
