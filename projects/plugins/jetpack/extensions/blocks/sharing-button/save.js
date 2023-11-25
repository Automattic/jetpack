import classNames from 'classnames';
import SocialIcon from 'social-logos';
import { getNameBySite } from './utils';
import './style.scss';

const SharingButtonsView = ( { attributes } ) => {
	const { service, label } = attributes;
	const sharingLinkClass = classNames(
		'jetpack-sharing-button__button',
		'style_button_replace_at_runtime',
		'share-' + service
	);

	const socialLinkName = getNameBySite( service );
	const socialLinkLabel = label ?? socialLinkName;

	return (
		<li className="jetpack-sharing-button__list-item">
			<a
				rel="nofollow noopener noreferrer"
				className={ sharingLinkClass }
				href={ 'url_replaced_in_runtime' }
				target="_blank"
				data-shared={ 'data-shared_replaced_in_runtime' }
				primary
			>
				<SocialIcon icon={ service } size={ 24 } />
				<span className="jetpack-sharing-button__service-label">{ socialLinkLabel }</span>
			</a>
		</li>
	);
};

export default SharingButtonsView;
