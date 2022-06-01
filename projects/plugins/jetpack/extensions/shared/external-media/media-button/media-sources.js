import { MenuItem } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { mediaSources } from '../sources';

function MediaSources( { originalButton = null, onClick = () => {}, open, setSource } ) {
	return (
		<Fragment>
			{ originalButton && originalButton( { open } ) }

			{ mediaSources.map( ( { icon, id, label } ) => (
				<MenuItem
					icon={ icon }
					key={ id }
					onClick={ () => {
						onClick();
						setSource( id );
					} }
				>
					{ label }
				</MenuItem>
			) ) }
		</Fragment>
	);
}

export default MediaSources;
