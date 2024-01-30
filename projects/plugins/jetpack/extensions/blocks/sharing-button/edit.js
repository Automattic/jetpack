import { useBlockProps } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import classNames from 'classnames';
import SocialIcon from 'social-logos';
import { getNameBySite } from './utils';
import './style.scss';
const SharingButtonEdit = ( { attributes, context } ) => {
	const { service, label } = attributes;
	const { styleType, iconColorValue, iconBackgroundColorValue } = context;

	const socialLinkName = getNameBySite( service );
	const socialLinkLabel = label ?? socialLinkName;

	const sharingButtonClass = classNames(
		'jetpack-sharing-button__button',
		'style-' + styleType,
		'share-' + service
	);

	const blockProps = useBlockProps( {
		className: 'jetpack-sharing-button__list-item',
	} );

	const defaultIconColor = styleType === 'icon' ? '#fff' : '#000';

	const buttonStype = {
		color: iconColorValue || defaultIconColor,
		backgroundColor: iconBackgroundColorValue,
	};

	return (
		<>
			<li { ...blockProps }>
				<Button className={ sharingButtonClass } style={ buttonStype }>
					<SocialIcon icon={ service } size={ 24 } />
					<span className={ 'jetpack-sharing-button__service-label' }>{ socialLinkLabel }</span>
				</Button>
			</li>
		</>
	);
};

export default SharingButtonEdit;
