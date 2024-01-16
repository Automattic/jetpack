import { combineReducers } from '@wordpress/data';
import { automations } from 'crm/state/automations-admin/reducer';

export const reducer = combineReducers( { automations } );
