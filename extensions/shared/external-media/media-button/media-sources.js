/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { mediaSources } from '../sources';

function MediaSources( { originalButton = null, open, setSource } ) {
	return (
		<Fragment>
			{ originalButton && originalButton( { open } ) }

			{ mediaSources.map( ( { icon, id, label } ) => (
				<MenuItem icon={ icon } key={ id } onClick={ () => setSource( id ) }>
					{ label }
				</MenuItem>
			) ) }
		</Fragment>
	);
}

export default MediaSources;
