import { Tip } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { deburr, lowerCase } from 'lodash';
import tipsList from './list';

/**
 * Create the contextual tip.
 *
 * @param {object}   props               - The function props.
 * @param {string}   props.searchTerm    - Search term text.
 * @param {boolean}  props.random        - Whether to choose a random tooltip on multiple matches.
 * @param {Function} props.canUserCreate - Function to check user permission.
 * @return {import('react').JSX.Element|null} - The contextual tip element or null if no tip is found.
 */
function ContextualTip( { searchTerm, random = false, canUserCreate } ) {
	if ( ! searchTerm ) {
		return null;
	}

	if ( ! tipsList.length ) {
		return null;
	}

	const normalizedSearchTerm = deburr( lowerCase( searchTerm ) ).replace( /^\//, '' );

	const foundTips = tipsList.filter(
		( { keywords, permission } ) =>
			canUserCreate( permission ) &&
			[ ...new Set( keywords ) ].some( keyword => normalizedSearchTerm.includes( keyword ) )
	);

	if ( ! foundTips.length ) {
		return null;
	}

	const index = random ? Math.floor( Math.random() * foundTips.length ) : 0;

	return (
		<div className="contextual-tip">
			<Tip>{ foundTips[ index ]?.description }</Tip>
		</div>
	);
}

export default compose(
	withSelect( select => {
		return {
			canUserCreate: type => select( 'core' ).canUser( 'create', type ),
		};
	} )
)( ContextualTip );
