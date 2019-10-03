/**
 * External dependencies
 */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import FormInputValidation from 'components/form-input-validation';
import Gridicon from 'components/gridicon';
import { assign, debounce, isEmpty, trim } from 'lodash';
import { isAkismetKeyValid, checkAkismetKey, isCheckingAkismetKey } from 'state/at-a-glance';
import analytics from 'lib/analytics';
import { Button, TextControl, Panel, PanelBody, PanelRow } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';

export const Antispam = withModuleSettingsFormHelpers(
	class extends Component {
		state = {
			apiKey: this.props.getOptionValue( 'wordpress_api_key' ),
			delayKeyCheck: false,
			currentEvent: {},
		};

		keyChanged = false;

		UNSAFE_componentWillMount() {
			this.debouncedCheckApiKeyTyped = debounce( this.checkApiKeyTyped, 500 );
		}

		checkApiKeyTyped = event => {
			if ( 0 < event.currentTarget.value.length ) {
				this.props.checkAkismetKey( event.currentTarget.value );
			}
			this.keyChanged = true;
			this.setState( {
				delayKeyCheck: false,
			} );
		};

		updateText = event => {
			const currentEvent = assign( {}, event );
			currentEvent.currentTarget.value = trim( currentEvent.currentTarget.value );
			this.setState(
				{
					apiKey: currentEvent.currentTarget.value,
					delayKeyCheck: true,
					currentEvent: currentEvent,
				},
				this.debouncedCheckApiKeyTyped( currentEvent )
			);
		};

		componentDidUpdate() {
			if (
				! this.props.isCheckingAkismetKey &&
				this.props.isAkismetKeyValid &&
				this.keyChanged &&
				! isEmpty( this.state.currentEvent )
			) {
				this.keyChanged = false;
				this.props.onOptionChange( this.state.currentEvent );
			}
		}

		trackOpenCard = () => {
			analytics.tracks.recordJetpackClick( {
				target: 'foldable-settings-open',
				feature: 'anti-spam',
			} );
		};

		updateTextWithKey = apiKey => {
			const event = {
				currentTarget: { value: apiKey },
				target: { name: 'wordpress_api_key', value: apiKey },
			};
			this.updateText( event );
		};

		render() {
			const textProps = {
				name: 'wordpress_api_key',
				value: this.state.apiKey,
				disabled: this.props.isSavingAnyOption( 'wordpress_api_key' ),
				onChange: this.updateText,
			};
			let akismetStatus = '';

			if ( null === this.props.isAkismetKeyValid ) {
				textProps.value = __( 'Fetching key…' );
				textProps.disabled = true;
			} else if ( '' === this.state.apiKey ) {
				textProps.value = '';
			} else if ( ! this.state.delayKeyCheck && ! this.props.isCheckingAkismetKey ) {
				if ( false === this.props.isAkismetKeyValid ) {
					akismetStatus = (
						<FormInputValidation
							isError
							text={ __( "There's a problem with your Antispam API key. {{a}}Learn more{{/a}}.", {
								components: {
									a: <a href={ 'https://docs.akismet.com/getting-started/api-key/' } />,
								},
							} ) }
						/>
					);
					textProps.isError = true;
				} else {
					akismetStatus = <FormInputValidation text={ __( 'Your Antispam key is valid.' ) } />;
					textProps.isValid = true;
				}
			} else if ( this.props.isCheckingAkismetKey ) {
				akismetStatus = (
					<div className="form-input-validation is-warning">
						<span>
							<Gridicon size={ 24 } icon="sync" />
							{ __( 'Checking key…' ) }
						</span>
					</div>
				);
			}

			let fieldStyle;
			if ( textProps.isValid ) {
				fieldStyle = 'is-valid';
			} else if ( textProps.isError ) {
				fieldStyle = 'is-error';
			}
			const isSaving = this.props.isSavingAnyOption( 'wordpress_api_key' );

			return (
				<Panel header={ __( 'Jetpack Anti-spam' ) }>
					<PanelBody
						title={ __( 'Your site is protected from spam' ) }
						icon="yes"
						initialOpen={ false }
					>
						<PanelRow className="form-security__text-field-panel-row">
							<div style={ { display: 'flex', flexDirection: 'column' } }>
								<TextControl
									className={ fieldStyle }
									disabled={ textProps.disabled }
									label={ __( 'Your API Key' ) }
									onChange={ this.updateTextWithKey }
									value={ this.state.apiKey }
								/>
								{ akismetStatus }
							</div>
							<Button
								isPrimary
								disabled={ isSaving || ! this.props.isDirty() }
								onClick={ this.props.onSubmit }
							>
								{ isSaving ? __( 'Saving…' ) : __( 'Save Settings' ) }
							</Button>
						</PanelRow>
					</PanelBody>
				</Panel>
			);
		}
	}
);

export default connect(
	state => {
		return {
			isAkismetKeyValid: isAkismetKeyValid( state ),
			isCheckingAkismetKey: isCheckingAkismetKey( state ),
		};
	},
	dispatch => {
		return {
			checkAkismetKey: ( apiKey = '' ) => dispatch( checkAkismetKey( apiKey ) ),
		};
	}
)( Antispam );
