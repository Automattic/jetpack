/**
 * External dependencies
 */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import TextInput from 'components/text-input';
import FoldableCard from 'components/foldable-card';
import FormInputValidation from 'components/form-input-validation';
import Gridicon from 'components/gridicon';
import debounce from 'lodash/debounce';
import assign from 'lodash/assign';
import isEmpty from 'lodash/isEmpty';
import trim from 'lodash/trim';
import { isAkismetKeyValid, checkAkismetKey, isCheckingAkismetKey } from 'state/at-a-glance';
import { FEATURE_SPAM_AKISMET_PLUS } from 'lib/plans/constants';
import analytics from 'lib/analytics';

/**
 * Internal dependencies
 */
import { FormFieldset, FormLabel } from 'components/forms';
import {
	ModuleSettingsForm as moduleSettingsForm,
} from 'components/module-settings/module-settings-form';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';

export const Antispam = moduleSettingsForm(
	class extends Component {
		state = {
			apiKey: this.props.getOptionValue( 'wordpress_api_key' ),
			delayKeyCheck: false,
			currentEvent: {},
		};

		keyChanged = false;

		componentWillMount() {
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

		render() {
			const textProps = {
				name: 'wordpress_api_key',
				value: this.state.apiKey,
				disabled: this.props.isSavingAnyOption( 'wordpress_api_key' ),
				onChange: this.updateText,
			};
			let akismetStatus = '',
				foldableHeader = __( 'Checking your spam protection…' ),
				explanation = true;

			if ( null === this.props.isAkismetKeyValid ) {
				textProps.value = __( 'Fetching key…' );
				textProps.disabled = true;
				explanation = false;
			} else if ( '' === this.state.apiKey ) {
				textProps.value = '';
				foldableHeader = __( 'Your site needs an Antispam key.' );
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
					foldableHeader = __( 'Your site is not protected from spam.' );
				} else {
					akismetStatus = <FormInputValidation text={ __( 'Your Antispam key is valid.' ) } />;
					textProps.isValid = true;
					foldableHeader = __( 'Your site is protected from spam.' );
					explanation = false;
				}
			} else if ( this.props.isCheckingAkismetKey ) {
				akismetStatus = (
					<div className="form-input-validation is-warning">
						<span><Gridicon size={ 24 } icon="sync" />{ __( 'Checking key…' ) }</span>
					</div>
				);
				explanation = false;
			}

			return (
				<SettingsCard
					{ ...this.props }
					header={ __( 'Spam filtering', { context: 'Settings header' } ) }
					saveDisabled={ this.props.isSavingAnyOption( 'wordpress_api_key' ) }
					feature={ FEATURE_SPAM_AKISMET_PLUS }
				>
					<FoldableCard onOpen={ this.trackOpenCard } header={ foldableHeader }>
						<SettingsGroup
							support={ {
								text: __( 'Removes spam from comments and contact forms.' ),
								link: 'https://akismet.com/jetpack/',
							} }
							>
							<FormFieldset>
								<FormLabel>
									<span className="jp-form-label-wide">{ __( 'Your API key' ) }</span>
									<TextInput { ...textProps } />
									{ akismetStatus }
								</FormLabel>
								{ explanation &&
									<p className="jp-form-setting-explanation">
										{ __(
											"If you don't already have an API key, then {{a}}get your API key here{{/a}}, and you'll be guided through the process of getting one.",
											{
												components: {
													a: <a href={ 'https://akismet.com/wordpress/' } />,
												},
											}
										) }
									</p> }
							</FormFieldset>
						</SettingsGroup>
					</FoldableCard>
				</SettingsCard>
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
