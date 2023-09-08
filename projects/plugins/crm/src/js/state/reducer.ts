import { combineReducers } from '@wordpress/data';
import { workflows } from 'crm/state/automations-admin/reducer';
import { inbox } from 'crm/state/inbox/reducer';

export const reducer = combineReducers( { workflows, inbox } );
