import { plugins as pluginsIcon, wordpress, color } from '@wordpress/icons';
import { useState } from 'react';
import useProtectData from '../../hooks/use-protect-data';

const flatData = ( data, icon ) => {
	if ( Array.isArray( data ) ) {
		return data.map( plugin => flatData( plugin, icon ) ).flat();
	}

	return data?.vulnerabilities?.map( vul => ( {
		...vul,
		...data,
		icon,
	} ) );
};

const mergeAllVuls = ( { core, plugins, themes } ) => [
	...flatData( core, wordpress ),
	...flatData( plugins, pluginsIcon ),
	...flatData( themes, color ),
];

const useVulsList = () => {
	const { plugins, themes, core } = useProtectData();
	const [ item, setItem ] = useState( {} );
	const [ list, setList ] = useState( mergeAllVuls( { core, plugins, themes } ) );
	const [ selected, setSelected ] = useState( list?.length ? 'all' : null );

	const handleSelected = id => {
		setSelected( id );

		if ( id === selected ) {
			return;
		}

		if ( id === 'all' ) {
			setList( mergeAllVuls( { core, plugins, themes } ) );
			setItem( {} );
			return;
		}

		if ( id === 'wordpress' ) {
			setList( flatData( core, wordpress ) );
			setItem( core );
			return;
		}

		const pluginsItem = plugins.find( vul => vul?.name === id );

		if ( pluginsItem ) {
			setList( flatData( pluginsItem, pluginsIcon ) );
			setItem( pluginsItem );
			return;
		}

		const themesItem = themes.find( vul => vul?.name === id );

		if ( themesItem ) {
			setList( flatData( themesItem, color ) );
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

export default useVulsList;
