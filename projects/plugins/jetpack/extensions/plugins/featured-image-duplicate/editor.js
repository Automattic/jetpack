import {
	getJetpackExtensionAvailability,
	registerJetpackPlugin,
} from '@automattic/jetpack-shared-extension-utils';
import { addFilter } from '@wordpress/hooks';
import { HiddenSync, withDuplicateNotice, withHiddenFeaturedImageBlock } from './components';
import { FEATURE_NAME } from '.';

if ( getJetpackExtensionAvailability( FEATURE_NAME ).available ) {
	addFilter( 'editor.PostFeaturedImage', `jetpack/${ FEATURE_NAME }`, withDuplicateNotice );
	addFilter( 'editor.BlockEdit', `jetpack/${ FEATURE_NAME }`, withHiddenFeaturedImageBlock );
}

registerJetpackPlugin( FEATURE_NAME, { render: HiddenSync } );
