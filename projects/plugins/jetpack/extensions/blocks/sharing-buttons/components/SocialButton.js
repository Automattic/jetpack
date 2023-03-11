import { __, sprintf } from '@wordpress/i18n';
import availableServices from '../available-services';
import { addQueryArgs } from '@wordpress/url';

const SocialButton = ({ service, post }) => {
	if ('email' === service) {
		const href = addQueryArgs('mailto:', {
			subject: __(sprintf('Shared post: %s', post.title), 'my-plugin'),
			body: post.link,
		});

		return (
			<a
				rel="nofollow noopener noreferrer"
				shared={`sharing-${service}-1`}
				href={href}
				className={`share-${service} sd-button share-icon`}
				target="_blank"
				title={`Click to share on ${availableServices[service]}`}
			>
				<span>{availableServices[service]}</span>
			</a>
		);
	}

	return (
		<a
			rel="nofollow noopener noreferrer"
			shared={`sharing-${service}-1`}
			href={`${post.link}?share=${service}&nb=1`}
			className={`share-${service} sd-button share-icon`}
			target="_blank"
			title={`Click to share on ${availableServices[service]}`}
		>
			<span>{availableServices[service]}</span>
		</a>
	);
};

SocialButton.defaultProps = {
	service: '',
	post: {},
};

export default SocialButton;
