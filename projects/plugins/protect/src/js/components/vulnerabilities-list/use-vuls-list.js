/**
 * External dependencies
 */
import { useState, useRef } from 'react';

/**
 * Internal dependencies
 */
import useProtectData from '../../hooks/use-protect-data';

const flatVulsData = data => {
	if ( Array.isArray( data ) ) {
		return data
			.map( ( { vulnerabilities, ...plugin } ) =>
				vulnerabilities.map( vul => ( { ...vul, ...plugin } ) )
			)
			.flat();
	}
	return data?.vulnerabilities?.map( vul => ( {
		...vul,
		...data,
	} ) );
};

const useVulsList = () => {
	const [ selected, setSelected ] = useState( 'all' );
	const { plugins, themes, core } = useProtectData();

	const { current: data } = useRef( {
		core: flatVulsData( core ),
		plugins: flatVulsData( plugins ),
		themes: flatVulsData( themes ),
	} );

	const [ list, setList ] = useState( [ ...data.core, ...data.plugins, ...data.themes ] );

	const handleSelected = id => {
		setSelected( id );

		if ( id !== selected ) {
			const fromPlugins = data.plugins.filter( vul => vul?.name === id );
			const fromThemes = data.themes.filter( vul => vul?.name === id );

			switch ( id ) {
				case 'all':
					setList( [ ...data.core, ...data.plugins, ...data.themes ] );
					break;
				case 'wordpress':
					setList( data.core );
					break;
				default:
					if ( fromPlugins.length ) {
						setList( fromPlugins );
						break;
					}
					if ( fromThemes.length ) {
						setList( fromThemes );
						break;
					}
			}
		}
	};

	return {
		list,
		selected,
		setSelected: handleSelected,
	};
};

export default useVulsList;
