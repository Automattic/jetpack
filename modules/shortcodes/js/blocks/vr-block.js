'use strict';

/* global wp */
/* eslint react/react-in-jsx-scope: 0 */

(function (blocks, components, i18n) {
	var registerBlockType = blocks.registerBlockType,
	    UrlInput = blocks.UrlInput;
	var Placeholder = components.Placeholder,
	    SelectControl = components.SelectControl;
	var __ = i18n.__;


	registerBlockType('jetpack/vr', {
		title: __('VR Image', 'jetpack'),
		icon: 'embed-photo',
		category: 'embed',
		support: {
			html: false
		},
		attributes: {
			url: {
				type: 'string'
			},
			view: {
				type: 'string'
			}
		},

		edit: function edit(props) {
			var attributes = props.attributes;

			var onSetUrl = function onSetUrl(value) {
				return props.setAttributes({ url: value });
			};
			var onSetView = function onSetView(value) {
				return props.setAttributes({ view: value });
			};

			var renderEdit = function renderEdit() {
				if (attributes.url && attributes.view) {
					return wp.element.createElement(
						'div',
						{ className: props.className },
						wp.element.createElement('iframe', {
							title: __('VR Image', 'jetpack'),
							allowFullScreen: 'true',
							frameBorder: '0',
							width: '100%',
							height: '300',
							src: 'https://vr.me.sh/view/?view=' + encodeURIComponent(attributes.view) + '&url=' + encodeURIComponent(attributes.url)
						})
					);
				}
				return wp.element.createElement(
					'div',
					null,
					wp.element.createElement(
						Placeholder,
						{
							key: 'placeholder',
							instructions: __('Enter URL to VR image', 'jetpack'),
							icon: 'format-image',
							label: __('VR Image', 'jetpack'),
							className: props.className
						},
						wp.element.createElement(UrlInput, {
							value: attributes.url,
							onChange: onSetUrl
						}),
						wp.element.createElement(
							'div',
							{ style: { marginTop: '10px' } },
							wp.element.createElement(SelectControl, {
								label: __('View Type', 'jetpack'),
								value: attributes.view,
								onChange: onSetView,
								options: [{ label: '', value: '' }, { label: __('360', 'jetpack'), value: '360' }, { label: __('Cinema', 'jetpack'), value: 'cinema' }]
							})
						)
					)
				);
			};

			return renderEdit();
		},
		save: function save(props) {
			return wp.element.createElement(
				'div',
				{ className: props.className },
				wp.element.createElement('iframe', {
					title: __('VR Image', 'jetpack'),
					allowFullScreen: 'true',
					frameBorder: '0',
					width: '100%',
					height: '300',
					src: 'https://vr.me.sh/view/?view=' + encodeURIComponent(props.attributes.view) + '&url=' + encodeURIComponent(props.attributes.url)
				})
			);
		}
	});
})(wp.blocks, wp.components, wp.i18n);