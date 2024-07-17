// eslint-disable-next-line wpcalypso/no-unsafe-wp-apis
import { __unstableInserterMenuExtension as InserterMenuExtension } from '@wordpress/block-editor';
import { useState } from '@wordpress/element';
import { registerPlugin } from '@wordpress/plugins';
import { debounce } from 'lodash';
import ContextualTip from './src/contextual-tip';

import './src/style.scss';

const ContextualTips = function () {
	const [ debouncedFilterValue, setFilterValue ] = useState( '' );

	const debouncedSetFilterValue = debounce( setFilterValue, 400 );

	return (
		<InserterMenuExtension>
			{ ( { filterValue, hasItems } ) => {
				if ( hasItems || ! filterValue ) {
					return null;
				}

				if ( debouncedFilterValue !== filterValue ) {
					debouncedSetFilterValue( filterValue );
				}

				return <ContextualTip searchTerm={ filterValue } />;
			} }
		</InserterMenuExtension>
	);
};

// Check if the experimental slot is available before to register plugin.
if ( typeof InserterMenuExtension !== 'undefined' ) {
	registerPlugin( 'block-inserter-contextual-tips', {
		render() {
			return <ContextualTips />;
		},
	} );
}
