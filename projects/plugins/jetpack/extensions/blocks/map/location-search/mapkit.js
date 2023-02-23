import { BaseControl, TextControl } from '@wordpress/components';
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import Lookup from '../lookup';
import { useMapKitSetup } from '../mapkit/hooks';

const placeholderText = __( 'Add a marker…', 'jetpack' );

const MapkitLocationSearch = ( { label, onAddPoint } ) => {
	const containerRef = useRef();
	const textRef = useRef();
	const { mapkit } = useMapKitSetup( containerRef );

	const autocompleter = {
		name: 'placeSearch',
		options: value => {
			return new Promise( function ( resolve, reject ) {
				const search = new mapkit.Search( {
					getsUserLocation: true,
				} );
				search.autocomplete( value, ( err, results ) => {
					if ( err ) {
						reject( err );
						return;
					}
					// filter out results from Yelp etc
					const filtered = results?.results.filter(
						result =>
							result.dependentLocalities === undefined || result.dependentLocalities?.length === 0
					);

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
			};
			onAddPoint( point );
			return value.placeName;
		},
	};

	const onReset = () => {
		textRef.current.value = '';
	};

	useEffect( () => {
		textRef.current.focus();
	}, [ textRef ] );

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
