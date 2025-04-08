import { Button, FormTokenField } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __, _n } from '@wordpress/i18n';
import { isEmpty } from 'lodash';

export const possibleEmbed = /^\s*(http[s]?:\/\/|<script)/;

export default function RestaurantPicker( props ) {
	const [ input, setInput ] = useState( '' );
	const [ selectedRestaurants, setSelectedRestaurants ] = useState( props.rids || [] );

	const idRegex = /^(\d+)$|\(#(\d+)\)$/;

	const onChange = selected => {
		// we try to parse the restaurant id
		const selectedIds = selected.map( restaurant => {
			const parsed = idRegex.exec( restaurant );
			if ( parsed ) {
				const selectedId = parsed[ 1 ] || parsed[ 2 ];
				return selectedId;
			}
			// and default we to user entry
			return restaurant;
		} );
		setSelectedRestaurants( selectedIds );
		props.onChange && props.onChange( selectedIds );
	};

	const onSubmit = event => {
		event.preventDefault();
		props.onSubmit( isEmpty( selectedRestaurants ) ? input : selectedRestaurants );
	};

	// Even though we don't search the OpenTable API
	// we still allow for multiple restaurants, hence
	// still use the token field
	const formInput = (
		<FormTokenField
			value={ selectedRestaurants }
			saveTransform={ token => ( possibleEmbed.test( token ) ? '' : token.trim() ) }
			onInputChange={ setInput }
			label={ _n( 'Restaurant ID', 'Restaurant IDs', selectedRestaurants.length, 'jetpack' ) }
			{ ...props }
			onChange={ onChange }
			__nextHasNoMarginBottom={ true }
			__next40pxDefaultSize={ true }
		/>
	);

	return (
		<div className="wp-block-jetpack-opentable-restaurant-picker">
			{ props.onSubmit ? (
				<form onSubmit={ onSubmit }>
					{ formInput }
					<Button variant="secondary" type="submit">
						{ __( 'Embed', 'jetpack' ) }
					</Button>
				</form>
			) : (
				formInput
			) }
		</div>
	);
}
