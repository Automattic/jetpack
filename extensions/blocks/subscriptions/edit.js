/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __, _n, sprintf } from '@wordpress/i18n';
import { TextControl, ToggleControl, PanelBody } from '@wordpress/components';
import { InspectorControls } from '@wordpress/block-editor';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SubmitButton from '../../shared/submit-button';
import './editor.scss';

export default function SubscriptionEdit( props ) {
	const { attributes, className, setAttributes } = props;
	const { subscribePlaceholder, showSubscribersTotal } = attributes;
	const [ subscriberCountString, setSubscriberCountString ] = useState( '' );

	const get_subscriber_count = () => {
		apiFetch( { path: '/wpcom/v2/subscribers/count' } ).then( count => {
			// Handle error condition
			if ( ! count.hasOwnProperty( 'count' ) ) {
				setSubscriberCountString( __( 'Subscriber count unavailable', 'jetpack' ) );
			} else {
				setSubscriberCountString(
					sprintf(
						_n( 'Join %s other subscriber', 'Join %s other subscribers', count.count, 'jetpack' ),
						count.count
					)
				);
			}
		} );
	};

	useEffect( () => {
		get_subscriber_count();
	}, [] );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Display Settings' ) }>
					<ToggleControl
						label={ __( 'Show subscriber count', 'jetpack' ) }
						checked={ showSubscribersTotal }
						onChange={ () => {
							setAttributes( { showSubscribersTotal: ! showSubscribersTotal } );
						} }
					/>
				</PanelBody>
			</InspectorControls>

			<div className={ className } role="form">
				{ showSubscribersTotal && <p role="heading">{ subscriberCountString }</p> }

				<TextControl
					placeholder={ subscribePlaceholder }
					disabled={ true }
					className="wp-block-jetpack-subscriptions__email-field"
				/>
				<SubmitButton { ...props } />
			</div>
		</>
	);
}
