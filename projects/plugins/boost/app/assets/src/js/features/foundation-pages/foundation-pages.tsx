import { __ } from '@wordpress/i18n';
import Meta from './meta/meta';
import SettingsItem from '$features/ui/settings-item/settings-item';

const FoundationPages = () => {
	return (
		<SettingsItem
			title={ __( 'Foundation Pages', 'jetpack-boost' ) }
			description={
				<p>
					{ __(
						'List the most important pages of your site. They will be optimized. The Page Speed scores are based on the first foundation page.',
						'jetpack-boost'
					) }
				</p>
			}
		>
			<Meta />
		</SettingsItem>
	);
};

export default FoundationPages;
