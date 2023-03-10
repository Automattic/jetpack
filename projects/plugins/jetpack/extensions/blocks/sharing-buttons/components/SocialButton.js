import { __ } from '@wordpress/i18n';
import SharingButtonContext from './context';

const services = {
	twitter: __( 'Twitter', 'jetpack' ),
	facebook: __( 'Facebook', 'jetpack' ),
};

const SocialButton = ( { service } ) => {
	return (
		<a
			rel="nofollow noopener noreferrer"
			shared={ `sharing-${ service }-1` }
			href={ `https://www.${ service }.com` }
			className={ `share-${ service } sd-button share-icon` }
			target="_blank"
			title={ `Click to share on ${ services[ service ] }` }
		>
			<span>{ services[ service ] }</span>
		</a>
	);
};

export default SocialButton;
