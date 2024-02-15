import WpcomTourKit from '@automattic/tour-kit';
import { render } from 'react';

const tourConfig = {
	// ... tour content
};
const TourComponent = () => {
	// determine if classic view is enabled and the user is due to see a tour.

	return <WpcomTourKit { ...tourConfig } />;
};
render( <TourComponent />, document.getElementById( 'wpcom-tour' ) );
