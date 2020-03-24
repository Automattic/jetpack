/**
 * External dependencies
 */
import { memo } from '@wordpress/element';

const Header = memo( ( { track, children } ) => (
	<div>
		{ /* TODO: display info based on `track` */ }
		{ track ? <div>{ track.title }</div> : null }
		<div>{ children }</div>
	</div>
) );

export default Header;
