import { range } from 'lodash';

// This is a dynamic block, meaning that its content is created on the server.
// This function is only to provide a fallback in case the block is deactivated
// or there is any problem with the render_callback in the server.
//
// Note that, unlike the normal ratings block, here we render as many symbols
// as the rating, not as the maxRating. This is for consistency: some symbols (star)
// have filled and stroke UTF-8 equivalents but other symbols don't (dollar, chilli).
// We can't provide the full styled experience using UTF-8, so we optimize
// for consistency.
export default fallbackSymbol =>
	function ( { className, attributes: { align, rating, color } } ) {
		return (
			<figure className={ className } style={ { textAlign: align } }>
				{ range( 1, rating + 1 ).map( position => (
					<span key={ position } style={ { color } }>
						{ fallbackSymbol }
					</span>
				) ) }
			</figure>
		);
	};
