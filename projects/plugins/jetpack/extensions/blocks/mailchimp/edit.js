import {
	isCurrentUserConnected,
	getBlockIconComponent,
} from '@automattic/jetpack-shared-extension-utils';
import apiFetch from '@wordpress/api-fetch';
import { useBlockProps } from '@wordpress/block-editor';
import { withNotices } from '@wordpress/components';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import metadata from './block.json';
import Body from './body';
import { API_STATE_CONNECTED, API_STATE_NOTCONNECTED, API_STATE_LOADING } from './constants';
import { MailChimpInspectorControls } from './controls';
import Loader from './loader';
import { UserConnectedPlaceholder, UserNotConnectedPlaceholder } from './placeholders';

const icon = getBlockIconComponent( metadata );

export const MailchimpSubscribeEdit = ( {
	attributes,
	setAttributes,
	notices,
	noticeUI,
	noticeOperations,
} ) => {
	const blockProps = useBlockProps();

	const [ audition, setAudition ] = useState( null );
	const [ connected, setConnected ] = useState( API_STATE_LOADING );
	const [ connectURL, setConnectURL ] = useState( null );
	const [ currentUserConnected, setCurrentUserconnected ] = useState( null );

	const apiCall = useCallback( () => {
		const isUserConnected = isCurrentUserConnected();

		if ( isUserConnected ) {
			apiFetch( { path: '/wpcom/v2/mailchimp', method: 'GET' } ).then(
				( { connect_url: url, code } ) => {
					setConnectURL( url );
					setConnected( code === 'connected' ? API_STATE_CONNECTED : API_STATE_NOTCONNECTED );
					setCurrentUserconnected( isUserConnected );
				},
				( { message } ) => {
					setConnectURL( null );
					setConnected( API_STATE_NOTCONNECTED );
					setCurrentUserconnected( isUserConnected );

					noticeOperations.removeAllNotices();
					noticeOperations.createErrorNotice( message );
				}
			);
		} else {
			apiFetch( {
				path: addQueryArgs( '/jetpack/v4/connection/url', {
					from: 'jetpack-block-editor',
					redirect: window.location.href,
				} ),
			} ).then( url => {
				setConnectURL( url );
				setConnected( API_STATE_NOTCONNECTED );
				setCurrentUserconnected( isUserConnected );
			} );
		}
	}, [ setConnectURL, setConnected, setCurrentUserconnected, noticeOperations ] );

	useEffect( () => {
		apiCall();
	}, [ apiCall ] );

	let content;

	if ( attributes.preview ) {
		content = (
			<Body attributes={ attributes } setAttributes={ setAttributes } audition={ audition } />
		);
	} else if ( connected === API_STATE_LOADING ) {
		content = <Loader icon={ icon } notices={ notices } />;
	} else if ( connected === API_STATE_NOTCONNECTED ) {
		if ( currentUserConnected ) {
			content = (
				<UserConnectedPlaceholder
					icon={ icon }
					notices={ notices }
					connectURL={ connectURL }
					apiCall={ apiCall }
				/>
			);
		} else {
			content = (
				<UserNotConnectedPlaceholder icon={ icon } notices={ notices } connectURL={ connectURL } />
			);
		}
	} else if ( connected === API_STATE_CONNECTED ) {
		content = (
			<>
				<MailChimpInspectorControls
					connectURL={ connectURL }
					attributes={ attributes }
					setAttributes={ setAttributes }
					setAudition={ setAudition }
				/>
				<Body attributes={ attributes } setAttributes={ setAttributes } audition={ audition } />
			</>
		);
	}

	return (
		<div { ...blockProps }>
			{ noticeUI }
			{ content }
		</div>
	);
};

export default withNotices( MailchimpSubscribeEdit );
