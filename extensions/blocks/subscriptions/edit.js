/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { TextControl, ToggleControl, PanelBody } from '@wordpress/components';
import { InspectorControls } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import SubmitButton from '../../shared/submit-button';

class SubscriptionEdit extends Component {
	state = {
		subscriberCountString: '',
	};

	componentDidMount() {
		// Get the subscriber count so it is available right away if the user toggles the setting
		this.get_subscriber_count();
	}

	render() {
		const { attributes, className, setAttributes } = this.props;
		const { subscribePlaceholder, showSubscribersTotal } = attributes;

		return (
			<div className={ className } role="form">
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

				{ showSubscribersTotal && <p role="heading">{ this.state.subscriberCountString }</p> }

				<TextControl placeholder={ subscribePlaceholder } disabled={ true } onChange={ () => {} } />
				<SubmitButton { ...this.props } />
			</div>
		);
	}

	get_subscriber_count() {
		apiFetch( { path: '/wpcom/v2/subscribers/count' } ).then( count => {
			// Handle error condition
			if ( ! count.hasOwnProperty( 'count' ) ) {
				this.setState( {
					subscriberCountString: __( 'Subscriber count unavailable', 'jetpack' ),
				} );
			} else {
				this.setState( {
					subscriberCountString: sprintf(
						_n( 'Join %s other subscriber', 'Join %s other subscribers', count.count, 'jetpack' ),
						count.count
					),
				} );
			}
		} );
	}

	onChangeSubmit( submitButtonText ) {
		this.props.setAttributes( { submitButtonText } );
	}
}

export default SubscriptionEdit;
