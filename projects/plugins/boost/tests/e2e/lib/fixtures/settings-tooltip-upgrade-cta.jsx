import UpgradeCTA from '$features/upgrade-cta/upgrade-cta';

// Stands in for InterstitialModalCTA, whose My Jetpack modal needs My Jetpack's
// product state. Renders the same button it renders when closed, which is the
// only part of it the tooltip shows.
const InterstitialModalCTA = ( { description = '', identifier } ) => (
	<UpgradeCTA identifier={ identifier } description={ description } />
);

export default InterstitialModalCTA;
