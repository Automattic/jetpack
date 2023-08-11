import { createInterpolateElement } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import FoldableCard from 'components/foldable-card';
import FormInputValidation from 'components/form-input-validation';
import { FormFieldset, FormLabel } from 'components/forms';
import Gridicon from 'components/gridicon';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import TextInput from 'components/text-input';
import analytics from 'lib/analytics';
import { FEATURE_SPAM_AKISMET_PLUS } from 'lib/plans/constants';
import { assign, debounce, isEmpty, trim } from 'lodash';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { isAkismetKeyValid, checkAkismetKey, isCheckingAkismetKey } from 'state/at-a-glance';

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
			this.props.checkAkismetKey( event.currentTarget.value );
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
				foldableHeader = __( 'Checking your spam protection…', 'jetpack' ),
				explanation = createInterpolateElement(
					__(
						"If you don't already have an API key, then <a>get your API key here</a>, and you'll be guided through the process of getting one.",
						'jetpack'
					),
					{
						a: <a href={ 'https://akismet.com/wordpress/' } />,
					}
				);

			if ( null === this.props.isAkismetKeyValid ) {
				textProps.value = __( 'Fetching key…', 'jetpack' );
				textProps.disabled = true;
				explanation = false;
			} else if (
				! this.props.isDirty() &&
				this.props.getSettingCurrentValue( 'wordpress_api_key' ) === '' &&
				this.props.isAkismetKeyValid
			) {
				textProps.value = __( "A valid key has been set in your site's configuration.", 'jetpack' );
				textProps.isValid = true;
				textProps.disabled = true;
				foldableHeader = __( 'Your site is protected from spam.', 'jetpack' );
				explanation = __( 'It looks like your API key has been set globally.', 'jetpack' );
				akismetStatus = (
					<FormInputValidation text={ __( 'Your Anti-spam key is valid.', 'jetpack' ) } />
				);
			} else if ( '' === this.state.apiKey ) {
				textProps.value = '';
				foldableHeader = __( 'Your site needs an Anti-spam key.', 'jetpack' );
			} else if ( ! this.state.delayKeyCheck && ! this.props.isCheckingAkismetKey ) {
				if ( false === this.props.isAkismetKeyValid ) {
					akismetStatus = (
						<FormInputValidation
							isError
							text={ createInterpolateElement(
								__(
									"There's a problem with your Anti-spam API key. <a>Learn more</a>.",
									'jetpack'
								),
								{
									a: <a href={ 'https://docs.akismet.com/getting-started/api-key/' } />,
								}
							) }
						/>
					);
					textProps.isError = true;
					foldableHeader = __( 'Your site is not protected from spam.', 'jetpack' );
				} else {
					akismetStatus = (
						<FormInputValidation text={ __( 'Your Anti-spam key is valid.', 'jetpack' ) } />
					);
					textProps.isValid = true;
					foldableHeader = __( 'Your site is protected from spam.', 'jetpack' );
					explanation = false;
				}
			} else if ( this.props.isCheckingAkismetKey ) {
				akismetStatus = (
					<div className="form-input-validation is-warning">
						<span>
							<Gridicon size={ 24 } icon="sync" />
							{ __( 'Checking key…', 'jetpack' ) }
						</span>
					</div>
				);
				explanation = false;
			}

			return (
				<SettingsCard
					{ ...this.props }
					header={ _x( 'Anti-spam', 'Settings header', 'jetpack' ) }
					saveDisabled={ this.props.isSavingAnyOption( 'wordpress_api_key' ) }
					feature={ FEATURE_SPAM_AKISMET_PLUS }
				>
					<FoldableCard onOpen={ this.trackOpenCard } header={ foldableHeader }>
						<SettingsGroup
							support={ {
								text: __( 'Removes spam from comments and contact forms.', 'jetpack' ),
								link: 'https://akismet.com/jetpack/',
							} }
						>
							<FormFieldset>
								<FormLabel>
									<span className="jp-form-label-wide">{ __( 'Your API key', 'jetpack' ) }</span>
									<TextInput { ...textProps } />
									{ akismetStatus }
								</FormLabel>
								{ explanation && <p className="jp-form-setting-explanation">{ explanation }</p> }
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
