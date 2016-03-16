import { combineReducers } from 'redux';
const initialState = require( 'state/sample-state-tree.js' );

const genericReducer = ( state = initialState, action ) => initialState;

export default combineReducers( {
	jetpack: genericReducer
} );
