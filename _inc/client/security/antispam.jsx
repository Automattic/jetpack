/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import TextInput from 'components/text-input';
import FoldableCard from 'components/foldable-card';
import FormInputValidation from 'components/form-input-validation';
import Gridicon from 'components/gridicon';
import debounce from 'lodash/debounce';
import assign from 'lodash/assign';
import { isAkismetKeyValid, checkAkismetKey, isCheckingAkismetKey } from 'state/at-a-glance';

/**
 * Internal dependencies
 */
import { FormFieldset, FormLabel } from 'components/forms';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';

export const Antispam = moduleSettingsForm(
	React.createClass( {

		getInitialState() {
			return {
				apiKey: this.props.getOptionValue( 'wordpress_api_key' ),
				delayKeyCheck: false
			};
		},

		componentWillMount() {
			this.debouncedCheckApiKeyTyped = debounce( this.checkApiKeyTyped, 500 );
		},

		checkApiKeyTyped( event ) {
			if ( 0 < event.currentTarget.value.length ) {
				this.props.checkAkismetKey( event.currentTarget.value );
			}
			this.setState( {
				delayKeyCheck: false
			} );
			this.props.onOptionChange( event );
		},

		updateText( event ) {
			this.setState(
				{
					apiKey: event.currentTarget.value,
					delayKeyCheck: true
				},
				this.debouncedCheckApiKeyTyped( assign( {}, event ) )
			);
		},

		render() {
			const textProps = {
				name: 'wordpress_api_key',
				value: this.state.apiKey,
				disabled: this.props.isSavingAnyOption( 'wordpress_api_key' ),
				onChange: this.updateText
			};
			let akismetStatus = '',
				explanation = false;

			if ( null === this.props.isAkismetKeyValid() ) {
				textProps.value = __( 'Fetching key…' );
				textProps.disabled = true;
			} else if ( '' === this.state.apiKey ) {
				textProps.value = '';
				explanation = true;
			} else if ( ! this.state.delayKeyCheck && ! this.props.isCheckingAkismetKey() ) {
				if ( false === this.props.isAkismetKeyValid() ) {
					akismetStatus = <FormInputValidation isError text={
							__( "There's a problem with your Antispam API key. {{a}}Learn more{{/a}}.", {
								components: {
									a: <a href={ 'https://docs.akismet.com/getting-started/api-key/' } />
								}
							} ) } />;
					textProps.isError = explanation = true;
				} else {
					akismetStatus = <FormInputValidation text={ __( 'Your Antispam key is valid & working' ) } />;
					textProps.isValid = true;
				}
			} else if ( this.props.isCheckingAkismetKey() ) {
				akismetStatus = (
					<div className="form-input-validation is-warning">
						<span><Gridicon size={ 24 } icon="sync" />{ __( 'Checking key…' ) }</span>
					</div>
				);
			}

			return (
				<SettingsCard
					{ ...this.props }
					header={ __( 'Spam filtering', { context: 'Settings header' } ) }>
					<FoldableCard
						header={ __( 'Your site is protected from spam' ) }
					>
						<SettingsGroup support="https://akismet.com/jetpack/">
							<FormFieldset>
								<FormLabel>
									<span className="jp-form-label-wide">{ __( 'Your API key' ) }</span>
									<TextInput
										{ ...textProps }
									/>
									{
										akismetStatus
									}
								</FormLabel>
								{
									explanation && (
										<p className="jp-form-setting-explanation" >
											{
												__( "If you don't already have an API key, then {{a}}get your API key here{{/a}}, and you'll be guided through the process of getting one in a new window.", {
													components: {
														a: <a href={ 'https://akismet.com/wordpress/' } />
													}
												} )
											}
										</p>
									)
								}
							</FormFieldset>
						</SettingsGroup>
					</FoldableCard>
				</SettingsCard>
			);
		}
	} )
);

export default connect(
	state => {
		return {
			isAkismetKeyValid: () => isAkismetKeyValid( state ),
			isCheckingAkismetKey: () => isCheckingAkismetKey( state )
		};
	},
	dispatch => {
		return {
			checkAkismetKey: ( apiKey = '' ) => dispatch( checkAkismetKey( apiKey ) )
		};
	}
)( Antispam );
