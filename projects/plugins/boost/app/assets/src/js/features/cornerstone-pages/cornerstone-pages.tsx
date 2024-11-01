import { __ } from '@wordpress/i18n';
import Meta from './meta/meta';
import SettingsItem from '$features/ui/settings-item/settings-item';
import Pill from '$features/ui/pill/pill';

const CornerstonePages = () => {
	return (
		<SettingsItem
			title={
				<>
					{ __( 'Cornerstone Pages', 'jetpack-boost' ) }
					<Pill text="Experimental" />
				</>
			}
			description={
				<p>
					{ __(
						'List the most important pages of your site. These pages will receive specially tailored optimizations, including targeted critical CSS. The Page Speed scores are based on the first cornerstone page.',
						'jetpack-boost'
					) }
				</p>
			}
		>
			<Meta />
		</SettingsItem>
	);
};

export default CornerstonePages;
