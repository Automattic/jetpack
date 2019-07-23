/**
 * External dependencies
 */
import React from 'react';

const Feature = ( { title, description, iconPath, iconAlt } ) => {
	return (
		<div>
			<div>
				<img src={ iconPath } alt={ iconAlt } />
			</div>
			<div>
				<h3>{ title }</h3>
				<p>{ description }</p>
			</div>
		</div>
	);
};

export default Feature;
