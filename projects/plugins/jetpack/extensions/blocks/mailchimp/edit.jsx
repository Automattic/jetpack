import {
	isCurrentUserConnected,
	getBlockIconComponent,
} from '@automattic/jetpack-shared-extension-utils';
import apiFetch from '@wordpress/api-fetch';
import { useBlockProps } from '@wordpress/block-editor';
import { withNotices } from '@wordpress/components';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
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
	const [ isRechecking, setIsRechecking ] = useState( false );

	const apiCall = useCallback( () => {
		const isUserConnected = isCurrentUserConnected();

		if ( isUserConnected ) {
			return apiFetch( { path: '/wpcom/v2/mailchimp', method: 'GET' } ).then(
				( { connect_url: url, code } ) => {
					setConnectURL( url );
					setConnected( code === 'connected' ? API_STATE_CONNECTED : API_STATE_NOTCONNECTED );
					setCurrentUserconnected( isUserConnected );
					return code;
				},
				( { message } ) => {
					setConnectURL( null );
					setConnected( API_STATE_NOTCONNECTED );
					setCurrentUserconnected( isUserConnected );

					noticeOperations.removeAllNotices();
					noticeOperations.createErrorNotice( message );
				}
			);
		}
		return apiFetch( {
			path: addQueryArgs( '/jetpack/v4/connection/url', {
				from: 'jetpack-block-editor',
				redirect: window.location.href,
			} ),
		} ).then( url => {
			setConnectURL( url );
			setConnected( API_STATE_NOTCONNECTED );
			setCurrentUserconnected( isUserConnected );
		} );
	}, [ setConnectURL, setConnected, setCurrentUserconnected, noticeOperations ] );

	useEffect( () => {
		apiCall();
	}, [ apiCall ] );

	const recheckConnection = useCallback( () => {
		setIsRechecking( true );
		noticeOperations.removeAllNotices();
		apiCall()
			.then( code => {
				// An authorized Mailchimp account still reads as not connected until an audience is saved.
				if ( code === 'not_connected' ) {
					noticeOperations.createNotice( {
						status: 'warning',
						content: __(
							'Mailchimp is not connected yet. Connect your account and choose an audience, then check again.',
							'jetpack'
						),
					} );
				}
			} )
			.finally( () => setIsRechecking( false ) );
	}, [ apiCall, noticeOperations ] );

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
					onRecheck={ recheckConnection }
					isRechecking={ isRechecking }
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
