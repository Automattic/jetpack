import { MenuItem } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import {
	internalMediaSources,
	externalMediaSources,
	featuredImageExclusiveMediaSources,
} from '../sources';

function MediaSources( {
	originalButton = null,
	onClick = () => {},
	open,
	setSource,
	isFeatured = false,
} ) {
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

			{ isFeatured &&
				featuredImageExclusiveMediaSources.map( ( { icon, id, label } ) => (
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
