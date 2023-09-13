import * as React from 'react';
import * as ReactDOM from 'react-dom';

const LaunchpadNavigatorAdminBar = () => {
	return <div id="test-div">This is a test div.</div>;
};

export default LaunchpadNavigatorAdminBar;

if ( window?.wpcomLaunchpadNavigatorAdminBar?.isLoaded ) {
	ReactDOM.render(
		<LaunchpadNavigatorAdminBar />,
		document.getElementById( 'wpcom-launchpad-navigator-adminbar' )
	);
}
