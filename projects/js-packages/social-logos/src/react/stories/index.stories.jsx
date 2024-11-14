/**
 * Internal dependencies
 */
import SocialLogoExamples from '../example';
import SocialLogo from '../index';
// the default export is metadata about the component
export default {
	title: 'JS Packages/Social Logos/Icons',
};
// the export called __default is the default state of the component
export const _default = () => {
	return <SocialLogo icon="wordpress" />;
};

export const _All = () => {
	return <SocialLogoExamples />;
};
