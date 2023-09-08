import { combineReducers } from '@wordpress/data';
import { workflows } from 'crm/state/automations-admin/reducer';
import { email } from 'crm/state/email/reducer';

export const reducer = combineReducers( { workflows, email } );
