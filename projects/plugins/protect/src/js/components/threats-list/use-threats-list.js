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
	const [ item, setItem ] = useState( {} );
	const [ list, setList ] = useState(
		mergeAllThreats( { core, plugins, themes, files, database } )
	);
	const [ selected, setSelected ] = useState( list?.length ? 'all' : null );

	const handleSelected = id => {
		setSelected( id );

		if ( id === selected ) {
			return;
		}

		if ( id === 'all' ) {
			setList( mergeAllThreats( { core, plugins, themes, files, database } ) );
			setItem( {} );
			return;
		}

		if ( id === 'wordpress' ) {
			setList( flatData( core, coreIcon ) );
			setItem( core );
			return;
		}

		if ( id === 'files' ) {
			setList( flatData( files, filesIcon ) );
			setItem( files );
			return;
		}

		if ( id === 'database' ) {
			setList( flatData( database, databaseIcon ) );
			setItem( database );
			return;
		}

		const pluginsItem = plugins.find( threat => threat?.name === id );

		if ( pluginsItem ) {
			setList( flatData( pluginsItem, pluginsIcon ) );
			setItem( pluginsItem );
			return;
		}

		const themesItem = themes.find( threat => threat?.name === id );

		if ( themesItem ) {
			setList( flatData( themesItem, themesIcon ) );
			setItem( themesItem );
			return;
		}
	};

	return {
		item,
		list,
		selected,
		setSelected: handleSelected,
	};
};

export default useThreatsList;
