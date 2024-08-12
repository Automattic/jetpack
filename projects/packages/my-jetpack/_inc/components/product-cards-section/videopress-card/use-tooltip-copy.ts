import { __ } from '@wordpress/i18n';

const useTooltipCopy = () => {
	const inactiveAndUninstalledCopy = {
		title: __( 'The finest video for WordPress', 'jetpack-my-jetpack' ),
		text: __(
			'Give your videos a boost! 🚀 Try hosting with VideoPress for superior quality and performance.',
			'jetpack-my-jetpack'
		),
	};

	return {
		inactiveAndUninstalledCopy,
	};
};

export default useTooltipCopy;
