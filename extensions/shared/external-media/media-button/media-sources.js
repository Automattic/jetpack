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
	const onClick = ( event, id ) => {
		event.stopPropagation();
		setSource( id );
	};

	return (
		<Fragment>
			{ originalButton && originalButton( { open } ) }

			{ mediaSources.map( ( { icon, id, label } ) => (
				<MenuItem icon={ icon } key={ id } onClick={ event => onClick( event, id ) }>
					{ label }
				</MenuItem>
			) ) }
		</Fragment>
	);
}

export default MediaSources;
