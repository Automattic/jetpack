import { createReduxStore } from '@wordpress/data';
import { reducer } from './reducer';

export const store = createReduxStore( 'crm', { reducer } );
