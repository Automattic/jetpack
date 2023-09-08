import { createReduxStore, register } from '@wordpress/data';
import { actions } from './actions';
import { reducer } from './reducer';
import { selectors } from './selectors';

// TODO: don't combine all stores into one CRM Store
export const store = createReduxStore( 'crm', { reducer, actions, selectors } );

register( store );
