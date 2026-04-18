import { BaseControl, Notice, TextControl } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { Icon, update as updateIcon } from '@wordpress/icons';
import { __, _x } from '@wordpress/i18n';
import { debounce, isEmpty } from 'lodash';
import { Component } from 'react';
import { connect } from 'react-redux';
// NOTE: FoldableCard has no direct @wordpress/ui equivalent; @wordpress/components
// offers Panel/PanelBody but the header/open-callback API differs enough that
// replacing it here would change props and analytics semantics. Keep and flag.
import FoldableCard from 'components/foldable-card';
// NOTE: withModuleSettingsFormHelpers is Jetpack's module form state HOC — keep.
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
// NOTE: SettingsCard / SettingsGroup are Jetpack-specific settings containers — keep.
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import analytics from 'lib/analytics';
import { FEATURE_SPAM_AKISMET_PLUS } from 'lib/plans/constants';
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

		// TextControl onChange gives us the value directly; we synthesize a minimal
		// event-like object for downstream handlers that still expect `currentTarget.value`.
		updateText = value => {
			const trimmed = String( value ).trim();
			const syntheticEvent = {
				target: { name: 'wordpress_api_key', value: trimmed },
				currentTarget: { name: 'wordpress_api_key', value: trimmed },
			};
			this.setState(
				{
					apiKey: trimmed,
					delayKeyCheck: true,
					currentEvent: syntheticEvent,
				},
				this.debouncedCheckApiKeyTyped( syntheticEvent )
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
				textProps.disabled = true;
				foldableHeader = __( 'Your site is protected from spam.', 'jetpack' );
				explanation = __( 'It looks like your API key has been set globally.', 'jetpack' );
				akismetStatus = (
					<Notice status="success" isDismissible={ false } className="form-input-validation">
						{ __( 'Your Anti-spam key is valid.', 'jetpack' ) }
					</Notice>
				);
			} else if ( '' === this.state.apiKey ) {
				textProps.value = '';
				foldableHeader = __( 'Your site needs an Anti-spam key.', 'jetpack' );
			} else if ( ! this.state.delayKeyCheck && ! this.props.isCheckingAkismetKey ) {
				if ( false === this.props.isAkismetKeyValid ) {
					akismetStatus = (
						<Notice status="error" isDismissible={ false } className="form-input-validation">
							{ createInterpolateElement(
								__(
									"There's a problem with your Anti-spam API key. <a>Learn more</a>.",
									'jetpack'
								),
								{
									a: <a href={ 'https://docs.akismet.com/getting-started/api-key/' } />,
								}
							) }
						</Notice>
					);
					foldableHeader = __( 'Your site is not protected from spam.', 'jetpack' );
				} else {
					akismetStatus = (
						<Notice status="success" isDismissible={ false } className="form-input-validation">
							{ __( 'Your Anti-spam key is valid.', 'jetpack' ) }
						</Notice>
					);
					foldableHeader = __( 'Your site is protected from spam.', 'jetpack' );
					explanation = false;
				}
			} else if ( this.props.isCheckingAkismetKey ) {
				akismetStatus = (
					<Notice status="warning" isDismissible={ false } className="form-input-validation">
						<span>
							<Icon icon={ updateIcon } size={ 24 } />
							{ __( 'Checking key…', 'jetpack' ) }
						</span>
					</Notice>
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
								link: 'https://akismet.com/support/getting-started/activate/',
								privacyLink: 'https://akismet.com/privacy/',
							} }
						>
							<BaseControl
								__nextHasNoMarginBottom
								label={ __( 'Your API key', 'jetpack' ) }
							>
								<TextControl
									__nextHasNoMarginBottom
									{ ...textProps }
								/>
								{ akismetStatus }
							</BaseControl>
							{ explanation && <p className="jp-form-setting-explanation">{ explanation }</p> }
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
