'use strict';

(function (wp, i18n) {
	wp.blocks.registerBlockType('jetpack/subscription-form', {
		title: i18n['Subscription Form'],
		icon: 'email-alt',
		category: 'common',
		attributes: {
			title: {
				type: 'string',
				default: 'Subscribe to this site'
			},
			subscribe_text: {
				type: 'string',
				default: i18n['Enter your email address to subscribe to this blog and receive notifications of new posts by email.']
			},
			subscribe_placeholder: {
				type: 'string',
				default: i18n['Email Address']
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

		edit: function edit(props) {
			var el = wp.element.createElement;
			function handleTitleChange(value) {
				props.setAttributes({
					title: value
				});
			}
			function handleSubscribeTextChange(value) {
				props.setAttributes({
					subscribe_text: value
				});
			}
			function handleSubscribeButtonChange(value) {
				props.setAttributes({
					subscribe_button: value
				});
			}
			function handleSuccessMessageChange(value) {
				props.setAttributes({
					success_message: value
				});
			}
			function handleShowSubscribersTotalChange(value) {
				props.setAttributes({
					show_subscribers_change: !!value
				});
			}

			return [el('div', {
				key: 'jetpack/subscription-form/preview',
				className: 'subscription-form'
			}, [!!props.attributes.title && el('h2', {
				key: 'jetpack/subscription-form/title/preview',
				className: 'subscription-form__title'
			}, props.attributes.title), el('form', { key: 'jetpack/subscription-form/preview' }, el('fieldset', { disabled: true }, [!!props.attributes.subscribe_text && el('div', {
				key: 'jetpack/subscription-form/subscribe_text/preview',
				id: 'subscribe-text',
				className: 'subscription-form__text'
			}, el('p', null, props.attributes.subscribe_text)), !!props.attributes.show_subscribers_total && el('p', {
				key: 'jetpack/subscription-form/show_subscribers_total/preview',
				className: 'subscription-form__subscribers'
			}, i18n['Join %s other subscribers'].replace('%s', '___')), el('p', {
				key: 'jetpack/subscription-form/email-field-wrapper',
				id: 'subscribe-email'
			}, [el('label', {
				key: 'jetpack/subscription-form/subscribe_placeholder/label',
				id: 'jetpack-subscribe-label',
				className: 'subscription-form__email-label'
			}, props.attributes.subscribe_placeholder), el('input', {
				key: 'jetpack/subscription-form/subscribe-placeholder/preview',
				type: 'email',
				required: 'required',
				className: 'required',
				placeholder: props.attributes.subscribe_placeholder,
				style: { display: 'block' }
			})]), el('p', {
				key: 'jetpack/subscription-form/subscribe-submit-wrapper',
				id: 'subscribe-submit'
			}, el('input', {
				key: 'jetpack/subscription-form/subscribe_button/preview',
				type: 'submit',
				value: props.attributes.subscribe_button
			}))]))]), !!props.focus && el(wp.blocks.InspectorControls, { key: 'inspector' }, [el(wp.blocks.BlockDescription, { key: 'jetpack/subscription-form/description' }, el('h3', null, i18n['Subscription Form settings'])), el(wp.blocks.InspectorControls.TextControl, {
				key: 'jetpack/subscription-form/title/edit',
				label: 'Title',
				value: props.attributes.title,
				onChange: handleTitleChange
			}), el(wp.blocks.InspectorControls.TextareaControl, {
				key: 'jetpack/subscription-form/subscribe_text/edit',
				label: i18n['Optional text to display to your readers:'],
				value: props.attributes.subscribe_text,
				onChange: handleSubscribeTextChange
			}), el(wp.blocks.InspectorControls.TextControl, {
				key: 'jetpack/subscription-form/subscribe_button/edit',
				label: 'Subscribe button',
				value: props.attributes.subscribe_button,
				onChange: handleSubscribeButtonChange
			}), el(wp.blocks.InspectorControls.TextareaControl, {
				key: 'jetpack/subscription-form/success_message/edit',
				label: i18n['Success Message Text:'],
				value: props.attributes.success_message,
				onChange: handleSuccessMessageChange
			}), el(wp.blocks.InspectorControls.CheckboxControl, {
				key: 'jetpack/subscription-form/show_subscribers_total/edit',
				label: i18n['Show total number of subscribers?'],
				checked: props.attributes.show_subscribers_total,
				onChange: handleShowSubscribersTotalChange
			})])];
		},

		save: function save() {
			return null;
		}

	});
})(window.wp, jpSubBlockI18n);