import { __, sprintf } from '@wordpress/i18n';
import classNames from 'classnames';
import { getSocialIcon } from './components/social-icons';
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
	const linkAriaLabel = sprintf(
		/* translators: %s refers to a string representation of sharing service, e.g. Facebook  */
		__( 'Share on %s', 'jetpack', /* dummy arg to avoid bad minification */ 0 ),
		socialLinkName
	);

	return (
		<li className="jetpack-sharing-button__list-item">
			<a
				rel="nofollow noopener noreferrer"
				className={ sharingLinkClass }
				href={ 'url_replaced_in_runtime' }
				target="_blank"
				data-shared={ 'data-shared_replaced_in_runtime' }
				aria-label={ linkAriaLabel }
				primary
			>
				{ getSocialIcon( service ) }

				<span className="jetpack-sharing-button__service-label" aria-hidden="true">
					{ socialLinkLabel }
				</span>
			</a>
		</li>
	);
};

export default SharingButtonsView;
