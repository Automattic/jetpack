import getJetpackData from './get-jetpack-data';
/**
 * Returns the jetpack block variation that is defined on the backend.
 *
 * @returns {?string} options are ['production', 'beta', 'experimental']
 */
export default function getJetpackBlocksVariation() {
	const data = getJetpackData();
	return data?.blocks_variation ?? 'production';
}
