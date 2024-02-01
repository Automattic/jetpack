import { BaseControl, TextControl } from '@wordpress/components';
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import Lookup from '../lookup';
import { useMapkit } from '../mapkit/hooks';

const placeholderText = __( 'Add a marker…', 'jetpack' );

const MapkitLocationSearch = ( { label, onAddPoint } ) => {
	const containerRef = useRef();
	const textRef = useRef();
	const { mapkit } = useMapkit();

	const autocompleter = {
		name: 'placeSearch',
		options: async value => {
			return new Promise( function ( resolve, reject ) {
				const search = new mapkit.Search( {
					includePointsOfInterest: false,
				} );
				search.autocomplete( value, ( err, results ) => {
					if ( err ) {
						reject( err );
						return;
					}
					// filter out results without coordinates
					const filtered = results?.results.filter( result => result.coordinate ) ?? [];

					// add placeName
					const withPlaceName = filtered.map( result => ( {
						...result,
						placeName: result.displayLines?.join( ', ' ),
					} ) );

					resolve( withPlaceName );
				} );
			} );
		},
		isDebounced: true,
		getOptionLabel: option => {
			return <span>{ option.placeName }</span>;
		},
		getOptionKeywords: option => [ option.placeName ],
		getOptionCompletion: option => {
			const { value } = option;
			const point = {
				placeTitle: value.placeName,
				title: value.placeName,
				caption: value.placeName,
				coordinates: {
					longitude: value.coordinate.longitude,
					latitude: value.coordinate.latitude,
				},
				// mapkit doesn't give us an id, so we'll make one containing the place name and coordinates
				id: `${ value.placeName } ${ Number( value.coordinate.latitude ).toFixed( 2 ) } ${ Number(
					value.coordinate.longitude
				).toFixed( 2 ) }`,
			};
			onAddPoint( point );
			return value.placeName;
		},
	};

	const onReset = () => {
		textRef.current.value = '';
	};

	useEffect( () => {
		setTimeout( () => {
			containerRef.current.querySelector( 'input' ).focus();
		}, 50 );
	}, [] );

	return (
		<div ref={ containerRef }>
			<BaseControl label={ label } className="components-location-search">
				<Lookup completer={ autocompleter } onReset={ onReset }>
					{ ( { isExpanded, listBoxId, activeId, onChange, onKeyDown } ) => (
						<TextControl
							placeholder={ placeholderText }
							ref={ textRef }
							onChange={ onChange }
							aria-expanded={ isExpanded }
							aria-owns={ listBoxId }
							aria-activedescendant={ activeId }
							onKeyDown={ onKeyDown }
						/>
					) }
				</Lookup>
			</BaseControl>
		</div>
	);
};

export default MapkitLocationSearch;
