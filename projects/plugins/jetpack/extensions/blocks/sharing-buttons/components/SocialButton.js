import { __ } from '@wordpress/i18n';
import availableServices from '../available-services';

const SocialButton = ({ service, link }) => {
	return (
		<a
			rel="nofollow noopener noreferrer"
			shared={`sharing-${service}-1`}
			href={`${link}?share=${service}&nb=1`}
			className={`share-${service} sd-button share-icon`}
			target="_blank"
			title={`Click to share on ${availableServices[service]}`}
		>
			<span>{availableServices[service]}</span>
		</a>
	);
};

export default SocialButton;
