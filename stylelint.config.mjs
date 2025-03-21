import WpStylelintConfig from '@wordpress/stylelint-config/scss.js';
// Remove the `stylelint-scss` plugin, which causes a problem and is included at a deeper level anyway.
WpStylelintConfig.plugins = [];
export default WpStylelintConfig;
