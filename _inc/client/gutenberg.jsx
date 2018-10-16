/* global wp */
/* eslint react/react-in-jsx-scope: 0 */
window.JetpackDashicon = ( { icon } ) => {
	const { Dashicon } = wp.components;
	return <span className="jetpack-icon"><Dashicon icon={ icon } /></span>;
};
