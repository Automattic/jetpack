import { useSelect } from '@wordpress/data';
import { STORE_ID } from '../../state/store';

/**
 * React custom hook to get the stats counts to display in the stats card.
 *
 * @returns {object} recent stats counts data
 */
export default function useStatsCounts() {
	const { statsCounts, isFetchingStatsCounts } = useSelect( select => {
		const { getStatsCounts, isFetchingStatsCounts: isRequestingStatsCounts } = select( STORE_ID );

		return {
			statsCounts: getStatsCounts(),
			isFetchingStatsCounts: isRequestingStatsCounts(),
		};
	} );

	return {
		statsCounts,
		isFetchingStatsCounts,
	};
}
