'use strict';

var _wp$blocks = wp.blocks,
    registerBlockType = _wp$blocks.registerBlockType,
    InspectorControls = _wp$blocks.InspectorControls,
    BlockDescription = _wp$blocks.BlockDescription,
    source = _wp$blocks.source;
var createElement = wp.element.createElement;
var text = source.text;


var i18n = jpSubBlockI18n;

registerBlockType('jetpack/subscription-form', {
	title: i18n['Subscription Form'],
	icon: 'email-alt',
	category: 'common',
	attributes: {
		title: {
			type: 'string',
			source: text('.subscription-form__title'),
			default: 'Subscribe to this site'
		},
		subscribe_text: {
			type: 'string',
			source: text('.subscription-form__text'),
			default: i18n['Enter your email address to subscribe to this blog and receive notifications of new posts by email.']
		},
		subscribe_button: {
			type: 'string',
			default: i18n['Subscribe']
		},
		success_message: {
			type: 'string',
			default: i18n['Success! An email was just sent to confirm your subscription. Please find the email now and click \'Confirm Follow\' to start subscribing.']
		},
		show_subscribers_total: {
			type: 'bool',
			default: true
		}
	},

	edit: function edit(_ref) {
		var attributes = _ref.attributes,
		    setAttributes = _ref.setAttributes,
		    focus = _ref.focus;

		function handleTitleChange(value) {
			setAttributes({
				title: value
			});
		}
		function handleSubscribeTextChange(value) {
			setAttributes({
				subscribe_text: value
			});
		}
		function handleSubscribeButtonChange(value) {
			setAttributes({
				subscribe_button: value
			});
		}
		function handleSuccessMessageChange(value) {
			setAttributes({
				success_message: value
			});
		}
		function handleShowSubscribersTotalChange(value) {
			setAttributes({
				show_subscribers_change: !!value
			});
		}

		var title = attributes.title,
		    subscribe_text = attributes.subscribe_text,
		    show_subscribers_total = attributes.show_subscribers_total,
		    subscribe_button = attributes.subscribe_button;


		return [wp.element.createElement(
			'div',
			{ key: 'subscription-form', className: 'subscription-form' },
			!!title && wp.element.createElement(
				'h2',
				{ className: 'subscription-form__title' },
				title
			),
			wp.element.createElement(
				'form',
				null,
				wp.element.createElement(
					'fieldset',
					{ disabled: true },
					!!subscribe_text && wp.element.createElement(
						'div',
						{ id: 'subscribe-text', className: 'subscription-form__text' },
						wp.element.createElement(
							'p',
							null,
							subscribe_text
						)
					),
					!!show_subscribers_total && wp.element.createElement(
						'p',
						{ className: 'subscription-form__subscribers' },
						i18n['Join %s other subscribers'].replace('%s', '___')
					),
					wp.element.createElement(
						'p',
						{ id: 'subscribe-email' },
						wp.element.createElement(
							'label',
							{
								id: 'jetpack-subscribe-label',
								className: 'subscription-form__email-label'
							},
							i18n['Email Address']
						),
						wp.element.createElement('input', {
							type: 'email',
							className: 'required',
							placeholder: i18n['Email Address'],
							style: { display: 'block' },
							required: true
						})
					),
					wp.element.createElement(
						'p',
						{ id: 'subscribe-submit' },
						wp.element.createElement('input', { type: 'submit', value: subscribe_button })
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
			)
		)];
	},

	save: function save(_ref2) {
		var attributes = _ref2.attributes;
		var title = attributes.title,
		    subscribe_text = attributes.subscribe_text,
		    show_subscribers_total = attributes.show_subscribers_total,
		    subscribe_button = attributes.subscribe_button;


		return wp.element.createElement(
			'div',
			{ className: 'subscription-form' },
			!!title && wp.element.createElement(
				'h2',
				{ className: 'subscription-form__title' },
				title
			),
			wp.element.createElement(
				'form',
				null,
				wp.element.createElement(
					'fieldset',
					{ disabled: true },
					!!subscribe_text && wp.element.createElement(
						'div',
						{ id: 'subscribe-text', className: 'subscription-form__text' },
						wp.element.createElement(
							'p',
							null,
							subscribe_text
						)
					),
					!!show_subscribers_total && wp.element.createElement(
						'p',
						{ className: 'subscription-form__subscribers' },
						i18n['Join %s other subscribers'].replace('%s', '___')
					),
					wp.element.createElement(
						'p',
						{ id: 'subscribe-email' },
						wp.element.createElement(
							'label',
							{
								id: 'jetpack-subscribe-label',
								className: 'subscription-form__email-label'
							},
							i18n['Email Address']
						),
						wp.element.createElement('input', {
							type: 'email',
							className: 'required',
							placeholder: i18n['Email Address'],
							style: { display: 'block' },
							required: true
						})
					),
					wp.element.createElement(
						'p',
						{ id: 'subscribe-submit' },
						wp.element.createElement('input', { type: 'submit', value: subscribe_button })
					)
				)
			)
		);
	}

});