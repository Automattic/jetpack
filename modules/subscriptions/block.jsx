/** @format */
const {
	registerBlockType,
	InspectorControls,
	BlockDescription,
	Editable,
	InspectorControls: { CheckboxControl, TextControl },
} = wp.blocks;
const { createElement } = wp.element;

const i18n = jpSubBlockI18n;

registerBlockType( 'jetpack/subscription-form', {
	title: i18n[ 'Subscription Form' ],
	icon: 'email-alt',
	category: 'common',
	attributes: {
		title: {
			type: 'string',
			default: 'Subscribe to this site',
		},
		// Using snake_case because the same attributes are passed to the
		// `jetpack_do_subscription_form` shortcode.
		subscribe_text: {
			type: 'string',
			default:
				i18n[
					'Enter your email address to subscribe to this blog and receive notifications of new posts by email.'
				],
		},
		// Using snake_case because the same attributes are passed to the
		// `jetpack_do_subscription_form` shortcode.
		subscribe_button: {
			type: 'string',
			default: i18n[ 'Subscribe' ],
		},
		// Using snake_case because the same attributes are passed to the
		// `jetpack_do_subscription_form` shortcode.
		success_message: {
			type: 'string',
			default:
				i18n[
					"Success! An email was just sent to confirm your subscription. Please find the email now and click 'Confirm Follow' to start subscribing."
				],
		},
		// Using snake_case because the same attributes are passed to the
		// `jetpack_do_subscription_form` shortcode.
		show_subscribers_total: {
			type: 'bool',
			// Keep this in sync with server defaults
			default: false,
		},
	},

	edit: function( { attributes, setAttributes, focus, setFocus } ) {
		const {
			title,
			subscribe_text,
			show_subscribers_total,
			subscribe_button,
			success_message,
		} = attributes;

		const toggleshow_subscribers_total = () =>
			setAttributes( { show_subscribers_total: ! show_subscribers_total } );

		return [
			<div key="subscription-form" className="subscription-form">
				{ !! title &&
					<h2 className="subscription-form__title">
						<input
							type="text"
							value={ title }
							onChange={ e => setAttributes( { title: e.target.value } ) }
						/>
					</h2> }
				<form>
					<fieldset>
						{ !! subscribe_text &&
							<div id="subscribe-text" className="subscription-form__text">
								<textarea
									value={ subscribe_text }
									onChange={ e => setAttributes( { subscribe_text: e.target.value } ) }
								/>
							</div> }
						{ !! show_subscribers_total &&
							i18n.subscriberCount > 0 &&
							<p className="subscription-form__subscribers">
								{ i18n[ 'Join %s other subscribers' ] }
							</p> }
						<div id="subscribe-email">
							<label id="jetpack-subscribe-label" className="subscription-form__email-label">
								{ i18n[ 'Email Address' ] }
							</label>
							<input
								type="email"
								className="required"
								placeholder={ i18n[ 'Email Address' ] }
								style={ { display: 'block' } }
								required
								disabled
							/>
						</div>
						<div id="subscribe-submit">
							<span className="button">
								{ subscribe_button }
							</span>
						</div>
					</fieldset>
				</form>
			</div>,
			!! focus &&
				<InspectorControls key="inspector">
					<BlockDescription>
						<h3>
							{ i18n[ 'Subscription Form settings' ] }
						</h3>
					</BlockDescription>
					<CheckboxControl
						label={ i18n[ 'Show total number of subscribers?' ] }
						checked={ show_subscribers_total }
						onChange={ toggleshow_subscribers_total }
					/>
					<TextControl
						label={ i18n[ 'Subscribe Button:' ] }
						value={ subscribe_button }
						onChange={ value => setAttributes( { subscribe_button: value } ) }
					/>
					<TextControl
						label={ i18n[ 'Success Message Text:' ] }
						value={ success_message }
						onChange={ value => setAttributes( { success_message: value } ) }
					/>
				</InspectorControls>,
		];
	},

	save: function() {
		return null;
	},
} );
