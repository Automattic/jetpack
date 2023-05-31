import {
	plugins as pluginsIcon,
	wordpress as coreIcon,
	color as themesIcon,
	code as filesIcon,
	grid as databaseIcon,
} from '@wordpress/icons';
import { useMemo, useState } from 'react';
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

const mergeThreats = ( { core, plugins, themes, files, database } ) => [
	...flatData( core, coreIcon ),
	...flatData( plugins, pluginsIcon ),
	...flatData( themes, themesIcon ),
	...flatData( files, filesIcon ),
	...flatData( database, databaseIcon ),
];

const sortThreats = threats => {
	return threats.sort( ( a, b ) => b.severity - a.severity );
};

const useThreatsList = () => {
	const { plugins, themes, core, files, database } = useProtectData();

	const [ selected, setSelected ] = useState( 'all' );

	const { list, item } = useMemo( () => {
		switch ( selected ) {
			case 'wordpress':
				return {
					list: sortThreats( flatData( core, coreIcon ) ),
					item: core,
				};
			case 'files':
				return {
					list: sortThreats( flatData( files, filesIcon ) ),
					item: files,
				};
			case 'database':
				return {
					list: sortThreats( flatData( database, databaseIcon ) ),
					item: database,
				};
			default:
				break;
		}

		const pluginsItem = plugins.find( threat => threat?.name === selected );
		if ( pluginsItem ) {
			return {
				list: sortThreats( flatData( pluginsItem, pluginsIcon ) ),
				item: pluginsItem,
			};
		}

		const themesItem = themes.find( threat => threat?.name === selected );
		if ( themesItem ) {
			return {
				list: sortThreats( flatData( themesItem, themesIcon ) ),
				item: themesItem,
			};
		}

		return {
			list: sortThreats( mergeThreats( { core, plugins, themes, files, database } ) ),
			item: null,
		};
	}, [ core, database, files, plugins, selected, themes ] );

	return {
		item,
		list,
		selected,
		setSelected,
	};
};

export default useThreatsList;
