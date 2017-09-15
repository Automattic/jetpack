'use strict';

/** @format */
var _wp$blocks = wp.blocks,
    registerBlockType = _wp$blocks.registerBlockType,
    InspectorControls = _wp$blocks.InspectorControls,
    BlockDescription = _wp$blocks.BlockDescription,
    Editable = _wp$blocks.Editable,
    _wp$blocks$InspectorC = _wp$blocks.InspectorControls,
    CheckboxControl = _wp$blocks$InspectorC.CheckboxControl,
    TextControl = _wp$blocks$InspectorC.TextControl;
var createElement = wp.element.createElement;


var i18n = jpSubBlockI18n;

registerBlockType('jetpack/subscription-form', {
	title: i18n['Subscription Form'],
	icon: 'email-alt',
	category: 'common',
	attributes: {
		title: {
			type: 'string',
			default: 'Subscribe to this site'
		},
		// Using snake_case because the same attributes are passed to the
		// `jetpack_do_subscription_form` shortcode.
		subscribe_text: {
			type: 'string',
			default: i18n['Enter your email address to subscribe to this blog and receive notifications of new posts by email.']
		},
		// Using snake_case because the same attributes are passed to the
		// `jetpack_do_subscription_form` shortcode.
		subscribe_button: {
			type: 'string',
			default: i18n['Subscribe']
		},
		// Using snake_case because the same attributes are passed to the
		// `jetpack_do_subscription_form` shortcode.
		success_message: {
			type: 'string',
			default: i18n["Success! An email was just sent to confirm your subscription. Please find the email now and click 'Confirm Follow' to start subscribing."]
		},
		// Using snake_case because the same attributes are passed to the
		// `jetpack_do_subscription_form` shortcode.
		show_subscribers_total: {
			type: 'bool',
			default: true
		},
		subscribersCount: {
			type: 'number',
			default: -1
		}
	},

	edit: function edit(_ref) {
		var attributes = _ref.attributes,
		    setAttributes = _ref.setAttributes,
		    focus = _ref.focus,
		    setFocus = _ref.setFocus;
		var title = attributes.title,
		    subscribe_text = attributes.subscribe_text,
		    show_subscribers_total = attributes.show_subscribers_total,
		    subscribe_button = attributes.subscribe_button,
		    success_message = attributes.success_message,
		    subscribersCount = attributes.subscribersCount;


		var toggleshow_subscribers_total = function toggleshow_subscribers_total() {
			return setAttributes({ show_subscribers_total: !show_subscribers_total });
		};

		var getSubscriberCount = function getSubscriberCount() {
			var restRootUrl = wp.api.utils.getRootUrl();

			return jQuery.getJSON(restRootUrl + 'wp-json/jetpack/get_subscriber_count');
		};

		if (subscribersCount === -1) {
			getSubscriberCount().then(function (data) {
				return setAttributes({ subscribersCount: data['value'] });
			});
		}

		return [wp.element.createElement(
			'div',
			{ key: 'subscription-form', className: 'subscription-form' },
			!!title && wp.element.createElement(
				'h2',
				{ className: 'subscription-form__title' },
				wp.element.createElement('input', {
					type: 'text',
					value: title,
					onChange: function onChange(e) {
						return setAttributes({ title: e.target.value });
					}
				})
			),
			wp.element.createElement(
				'form',
				null,
				wp.element.createElement(
					'fieldset',
					null,
					!!subscribe_text && wp.element.createElement(
						'div',
						{ id: 'subscribe-text', className: 'subscription-form__text' },
						wp.element.createElement('textarea', {
							value: subscribe_text,
							onChange: function onChange(e) {
								return setAttributes({ subscribe_text: e.target.value });
							}
						})
					),
					!!show_subscribers_total && subscribersCount > 0 && wp.element.createElement(
						'p',
						{ className: 'subscription-form__subscribers' },
						i18n['Join %s other subscribers'].replace('%s', subscribersCount)
					),
					wp.element.createElement(
						'p',
						{ id: 'subscribe-email' },
						wp.element.createElement(
							'label',
							{ id: 'jetpack-subscribe-label', className: 'subscription-form__email-label' },
							i18n['Email Address']
						),
						wp.element.createElement('input', {
							type: 'email',
							className: 'required',
							placeholder: i18n['Email Address'],
							style: { display: 'block' },
							required: true,
							disabled: true
						})
					),
					wp.element.createElement(
						'p',
						{ id: 'subscribe-submit' },
						wp.element.createElement('input', { type: 'submit', value: subscribe_button, disabled: true })
					)
				)
			)
		), !!focus && wp.element.createElement(
			InspectorControls,
			{ key: 'inspector' },
			wp.element.createElement(
				BlockDescription,
				null,
				wp.element.createElement(
					'h3',
					null,
					i18n['Subscription Form settings']
				)
			),
			wp.element.createElement(CheckboxControl, {
				label: i18n['Show total number of subscribers?'],
				checked: show_subscribers_total,
				onChange: toggleshow_subscribers_total
			}),
			wp.element.createElement(TextControl, {
				label: i18n['Subscribe Button:'],
				value: subscribe_button,
				onChange: function onChange(value) {
					return setAttributes({ subscribe_button: value });
				}
			}),
			wp.element.createElement(TextControl, {
				label: i18n['Success Message Text:'],
				value: success_message,
				onChange: function onChange(value) {
					return setAttributes({ success_message: value });
				}
			})
		)];
	},

	save: function save() {
		return null;
	}
});