/**
 * External dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';
import classnames from 'classnames';
/**
 * Internal dependencies
 */
import { getVideoPressUrl } from '../url';

export default function save( { attributes } ) {
	const { align, autoplay, guid, controls } = attributes;

	const blockProps = useBlockProps.save( {
		className: classnames( 'jetpack-videopress', {
			[ `align${ align }` ]: align,
		} ),
	} );

	const url = getVideoPressUrl( guid, {
		autoplay,
		controls,
	} );

	return (
		<figure { ...blockProps }>
			<div className="jetpack-videopress__wrapper">
				{ `\n${ url }\n` /* URL needs to be on its own line. */ }
			</div>
		</figure>
	);
}
