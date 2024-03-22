import {
	PublicizePanel,
	SocialImageGeneratorPanel,
	usePublicizeConfig,
} from '@automattic/jetpack-publicize-components';
import UpsellNotice from './components/upsell';
import PostPublishPanels from './post-publish';
import PrePublishPanels from './pre-publish';

const Settings = () => {
	const { isSocialImageGeneratorAvailable } = usePublicizeConfig();

	return (
		<>
			<PublicizePanel>
				<UpsellNotice />
			</PublicizePanel>
			{ isSocialImageGeneratorAvailable && <SocialImageGeneratorPanel /> }
			<PrePublishPanels isSocialImageGeneratorAvailable={ isSocialImageGeneratorAvailable } />
			<PostPublishPanels />
		</>
	);
};

export default Settings;
