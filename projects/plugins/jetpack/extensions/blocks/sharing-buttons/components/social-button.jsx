import { __, sprintf } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import SocialIcon from 'social-logos';
import availableServices from '../available-services';

const mountLink = ( service, post ) => {
	if ( 'email' === service ) {
		return addQueryArgs( 'mailto:', {
			subject: sprintf(
				/* translators: placeholder is post title. */
				__( 'Shared post: %s', 'jetpack' ),
				post.title
			),
			body: post.link,
		} );
	}
	return addQueryArgs( post.link, {
		share: service,
		nb: 1,
	} );
};

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
