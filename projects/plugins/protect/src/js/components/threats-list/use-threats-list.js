import {
	plugins as pluginsIcon,
	wordpress as coreIcon,
	color as themesIcon,
	code as filesIcon,
	grid as databaseIcon,
} from '@wordpress/icons';
import { useMemo, useState } from 'react';
import useProtectData from '../../hooks/use-protect-data';

const sortThreats = ( a, b ) => b.severity - a.severity;

/**
 * Flatten threats data
 *
 * Merges threat category data with each threat it contains, plus any additional data provided.
 *
 * @param {object} data    - The threat category data, i.e. "core", "plugins", "themes", etc.
 * @param {object} newData - Additional data to add to each threat.
 * @returns {object[]} Array of threats with additional properties from the threat category and function argument.
 */
const flattenThreats = ( data, newData ) => {
	// If "data" is an empty object
	if ( typeof data === 'object' && Object.keys( data ).length === 0 ) {
		return [];
	}

	// If "data" has multiple entries, recursively flatten each one.
	if ( Array.isArray( data ) ) {
		return data.map( extension => flattenThreats( extension, newData ) ).flat();
	}

	// Merge the threat category data with each threat it contains, plus any additional data provided.
	return data?.threats.map( threat => ( {
		...threat,
		...data,
		...newData,
	} ) );
};

/**
 * Threats List Hook
 *
 * @typedef {object} UseThreatsList
 * @property {object}   item        - The selected threat category.
 * @property {object[]} list        - The list of threats to display.
 * @property {string}   selected    - The selected threat category.
 * @property {Function} setSelected - Sets the selected threat category.
 * ---
 * @returns {UseThreatsList} useThreatsList hook.
 */
const useThreatsList = () => {
	const [ selected, setSelected ] = useState( 'all' );

	const { plugins, themes, core, files, database } = useProtectData();

	const { unsortedList, item } = useMemo( () => {
		// If a specific threat category is selected, filter for and flatten the category's threats.
		if ( selected && selected !== 'all' ) {
			// Core, files, and database data threats are already grouped together,
			// so we just need to flatten them and add the appropriate icon.
			switch ( selected ) {
				case 'wordpress':
					return {
						unsortedList: flattenThreats( core, { icon: coreIcon } ),
						item: core,
					};
				case 'files':
					return {
						unsortedList: flattenThreats( files, { icon: filesIcon } ),
						item: files,
					};
				case 'database':
					return {
						unsortedList: flattenThreats( database, { icon: databaseIcon } ),
						item: database,
					};
				default:
					break;
			}

			// Extensions (i.e. plugins and themes) have entries for each individual extension,
			// so we need to check for a matching threat in each extension.
			const selectedPlugin = plugins.find( plugin => plugin?.name === selected );
			if ( selectedPlugin ) {
				return {
					unsortedList: flattenThreats( selectedPlugin, { icon: pluginsIcon } ),
					item: selectedPlugin,
				};
			}
			const selectedTheme = themes.find( theme => theme?.name === selected );
			if ( selectedTheme ) {
				return {
					unsortedList: flattenThreats( selectedTheme, { icon: themesIcon } ),
					item: selectedTheme,
				};
			}
		}

		// Otherwise, return all threats.
		return {
			unsortedList: [
				...flattenThreats( core, { icon: coreIcon } ),
				...flattenThreats( plugins, { icon: pluginsIcon } ),
				...flattenThreats( themes, { icon: themesIcon } ),
				...flattenThreats( files, { icon: filesIcon } ),
				...flattenThreats( database, { icon: databaseIcon } ),
			],
			item: null,
		};
	}, [ core, database, files, plugins, selected, themes ] );

	const list = useMemo( () => {
		return [ ...unsortedList ].sort( sortThreats );
	}, [ unsortedList ] );

	return {
		item,
		list,
		selected,
		setSelected,
	};
};

export default useThreatsList;
