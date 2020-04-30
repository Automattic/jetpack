/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { Button, FormTokenField } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __, _n } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useRestaurantSearch, { possibleEmbed } from './use-restaurant-search';

const MAX_SUGGESTIONS = 20;

export default function RestaurantPicker( props ) {
	const [ input, setInput ] = useState( '' );
	const restaurants = useRestaurantSearch( input, MAX_SUGGESTIONS );
	const [ selectedRestaurants, setSelectedRestaurants ] = useState( props.rids || [] );

	const idRegex = /^(\d+)$|\(\#(\d+)\)$/;

	const onChange = selected => {
		const selectedIds = selected.map( restaurant => {
			const parsed = idRegex.exec( restaurant );
			const selectedId = parsed[ 1 ] || parsed[ 2 ];

			return selectedId;
		} );
		setSelectedRestaurants( selectedIds );
		props.onChange && props.onChange( selectedIds );
	};

	const restaurantNames = restaurants
		.filter( restaurant => selectedRestaurants.indexOf( restaurant.rid.toString() ) )
		.map( restaurant => restaurant.name + ` (#${ restaurant.rid })` );

	const onSubmit = event => {
		event.preventDefault();
		props.onSubmit( isEmpty( selectedRestaurants ) ? input : selectedRestaurants );
	};

	const formInput = (
		<FormTokenField
			value={ selectedRestaurants }
			suggestions={ restaurantNames }
			saveTransform={ token => ( possibleEmbed.test( token ) ? '' : token.trim() ) }
			onInputChange={ setInput }
			maxSuggestions={ MAX_SUGGESTIONS }
			label={ _n( 'Restaurant', 'Restaurants', selectedRestaurants.length, 'jetpack' ) }
			{ ...props }
			onChange={ onChange }
		/>
	);

	return (
		<div className="wp-block-jetpack-opentable-restaurant-picker">
			{ props.onSubmit ? (
				<form onSubmit={ onSubmit }>
					{ formInput }
					<Button isSecondary isLarge type="submit">
						{ __( 'Embed', 'jetpack' ) }
					</Button>
				</form>
			) : (
				formInput
			) }
		</div>
	);
}
