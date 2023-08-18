import PluginInstallSection from 'components/plugin-install-section';
import SectionHeader from 'components/section-header';
import PropTypes from 'prop-types';

import './style.scss';

export const PluginDashItem = ( {
	installOrActivatePrompt,
	pluginLink,
	pluginName,
	pluginSlug,
	pluginFiles,
} ) => {
	return (
		<div className="plugin-dash-item">
			<SectionHeader className="plugin-dash-item__section-header" label={ pluginName } />
			<PluginInstallSection
				pluginName={ pluginName }
				pluginSlug={ pluginSlug }
				pluginLink={ pluginLink }
				pluginFiles={ pluginFiles }
				installOrActivatePrompt={ installOrActivatePrompt }
			/>
		</div>
	);
};

PluginDashItem.propTypes = {
	pluginName: PropTypes.string.isRequired,
	pluginFiles: PropTypes.arrayOf( PropTypes.string ).isRequired,
	pluginSlug: PropTypes.string.isRequired,
	pluginLink: PropTypes.string.isRequired,
	installOrActivatePrompt: PropTypes.element.isRequired,
};

export default PluginDashItem;
