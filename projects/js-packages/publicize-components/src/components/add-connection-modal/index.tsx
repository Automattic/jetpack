import { SocialServiceIcon } from '@automattic/jetpack-components';
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const getSupportedConnections = () => {
	return [
		{
			title: __( 'Facebook', 'jetpack' ),
			icon: props => <SocialServiceIcon serviceName="facebook" { ...props } />,
			name: 'facebook',
		},
		{
			title: __( 'Instagram', 'jetpack' ),
			icon: props => <SocialServiceIcon serviceName="instagram" { ...props } />,
			name: 'instagram',
		},
		{
			title: __( 'LinkedIn', 'jetpack' ),
			icon: props => <SocialServiceIcon serviceName="linkedin" { ...props } />,
			name: 'linkedin',
		},
		{
			title: __( 'Nextdoor', 'jetpack' ),
			icon: props => <SocialServiceIcon serviceName="nextdoor" { ...props } />,
			name: 'nextdoor',
		},
		{
			title: __( 'Tumblr', 'jetpack' ),
			icon: props => <SocialServiceIcon serviceName="tumblr-alt" { ...props } />,
			name: 'tumblr',
		},
		{
			title: __( 'Mastodon', 'jetpack' ),
			icon: props => <SocialServiceIcon serviceName="mastodon" { ...props } />,
			name: 'mastodon',
		},
	];
};

const AddConnectionModal = ( { onCloseModal } ) => {
	return (
		<Modal onRequestClose={ onCloseModal } title={ __( 'Add a connection', 'jetpack' ) }>
			<div>
				<ul>
					{ getSupportedConnections().map( service => (
						<li key={ service.name }>
							<button>
								<service.icon /> &nbsp; { service.title }
							</button>
						</li>
					) ) }
				</ul>
			</div>
		</Modal>
	);
};

export default AddConnectionModal;
