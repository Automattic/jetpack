import { MenuItem } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { internalMediaSources, externalMediaSources } from '../sources';

function MediaSources( { originalButton = null, onClick = () => {}, open, setSource } ) {
	return (
		<Fragment>
			{ originalButton && originalButton( { open } ) }
			{ internalMediaSources.map( ( { icon, id, label } ) => (
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

			<hr style={ { marginLeft: '-8px', marginRight: '-8px' } } />

			{ externalMediaSources.map( ( { icon, id, label } ) => (
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
