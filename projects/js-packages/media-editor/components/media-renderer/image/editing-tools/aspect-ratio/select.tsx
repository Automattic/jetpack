/**
 * WordPress dependencies
 */
import { SelectControl } from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { AspectRatioComponentProps, AspectRatio } from './types.ts';

const EMPTY_ARRAY: AspectRatio[] | [] = [];

/**
 *
 * @param root0
 * @param root0.onChange
 * @param root0.aspectRatio
 * @param root0.imageAspectRatios
 * @param root0.defaultRatios
 * @param root0.themeRatios
 */
export default function AspectRatioSelect( {
	onChange,
	aspectRatio,
	imageAspectRatios = EMPTY_ARRAY,
	defaultRatios = EMPTY_ARRAY,
	themeRatios = EMPTY_ARRAY,
}: AspectRatioComponentProps ) {
	const allRatios = useMemo(
		() => [ ...imageAspectRatios, ...defaultRatios, ...themeRatios ],
		[ imageAspectRatios, defaultRatios, themeRatios ]
	);

	const aspectRatioOptions = useMemo(
		() =>
			allRatios.map( ( { name, slug } ) => ( {
				label: name,
				value: slug,
			} ) ),
		[ allRatios ]
	);

	const handleChange = useCallback(
		( value: string ) => {
			const ratio = allRatios.find( ( { slug: _slug } ) => _slug === value );
			if ( ratio ) {
				onChange( ratio );
			}
		},
		[ allRatios, onChange ]
	);

	return (
		<SelectControl
			label={ __( 'Aspect ratio', 'jetpack-media-editor' ) }
			value={ aspectRatio.slug }
			options={ aspectRatioOptions }
			onChange={ handleChange }
		/>
	);
}
