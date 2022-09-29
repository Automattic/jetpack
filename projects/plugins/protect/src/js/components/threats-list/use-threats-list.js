import {
	plugins as pluginsIcon,
	wordpress as coreIcon,
	color as themesIcon,
	code as filesIcon,
	grid as databaseIcon,
} from '@wordpress/icons';
import { useState } from 'react';
import useProtectData from '../../hooks/use-protect-data';

const flatData = ( data, icon ) => {
	if ( Array.isArray( data ) ) {
		return data.map( plugin => flatData( plugin, icon ) ).flat();
	}

	return data?.threats?.map( threat => ( {
		...threat,
		...data,
		icon,
	} ) );
};

const mergeAllThreats = ( { core, plugins, themes, files, database } ) => [
	...flatData( core, coreIcon ),
	...flatData( plugins, pluginsIcon ),
	...flatData( themes, themesIcon ),
	...flatData( files, filesIcon ),
	...flatData( database, databaseIcon ),
];

const useThreatsList = () => {
	const { plugins, themes, core, files, database } = useProtectData();

	let list = mergeAllThreats( { core, plugins, themes, files, database } );
	let item = {};

	const [ selected, setSelected ] = useState( list.length ? 'all' : null );

	switch ( selected ) {
		case 'all':
			list = mergeAllThreats( { core, plugins, themes, files, database } );
			break;
		case 'wordpress':
			list = flatData( core, coreIcon );
			item = core;
			break;
		case 'files':
			list = flatData( files, filesIcon );
			item = files;
			break;
		case 'database':
			list = flatData( database, databaseIcon );
			item = database;
			break;
		default:
			break;
	}

	const pluginsItem = plugins.find( threat => threat?.name === selected );

	if ( pluginsItem ) {
		list = flatData( pluginsItem, pluginsIcon );
		item = pluginsItem;
	}

	const themesItem = themes.find( threat => threat?.name === selected );

	if ( themesItem ) {
		list = flatData( themesItem, themesIcon );
		item = themesItem;
	}

	return {
		item,
		list,
		selected,
		setSelected,
	};
};

export default useThreatsList;
