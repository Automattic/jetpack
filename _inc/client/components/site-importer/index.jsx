/**
 * External dependencies
 */
import React from 'react';

export default function SiteImporter( { active } ) {
	if ( ! active ) {
		return false;
	}
	return <div>hola mundo</div>;
}
