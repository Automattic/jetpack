/* global wp:true */
/* global React:true */
/* eslint-disable react/jsx-no-bind */
/**
 * External dependencies
 */
//const React = react;

/**
 * Internal dependencies
 */
const { __ } = wp.i18n;

const {
	registerBlockType,
	PlainText,
	BlockControls,
} = wp.blocks;

const el = wp.element.createElement;

registerBlockType( 'jetpack/markdown-block', {

	title: 'Markdown',

	description: __( 'We are going to have MARKDOWN!.' ),

	icon: el(
		'svg',
		{
			xmlns: 'http://www.w3.org/2000/svg',
			'class': 'dashicons',
			width: '208',
			height: '128',
			viewBox: '0 0 208 128',
			stroke: 'currentColor'
		},
		el(
			'rect',
			{
				width: '198',
				height: '118',
				x: '5',
				y: '5',
				ry: '10',
				'stroke-width': '10',
				fill: 'none'
			}
		),
		el(
			'path', { d: 'M30 98v-68h20l20 25 20-25h20v68h-20v-39l-20 25-20-25v39zM155 98l-30-33h20v-35h20v35h20z' }
		)
	),

	category: 'formatting',

	attributes: {
		preview: false,
		content: {
			type: 'string',
			source: 'property',
			selector: 'textarea',
			property: 'textContent',
		},

	},

	supports: {
		html: false,
	},
	edit( { attributes, setAttributes, className, isSelected } ) {
		return [
			isSelected && (
				<BlockControls key="controls">
					<div className="components-toolbar">
						<button
							className={ 'components-tab-button is-active' }>
							<span>Markdown</span>
						</button>
					</div>
				</BlockControls>
			),
			<PlainText
				className={ className }
				markdown="1"
				value={ attributes.content }
				onChange={ ( content ) => setAttributes( { content } ) }
				aria-label={ __( 'Markdown' ) }
			/>,
		];
	},
	save( { attributes, className } ) {
		return (
			<PlainText
				className={ className }
				markdown="1"
				value={ attributes.content }
				aria-label={ __( 'Markdown' ) }
			/>
		);
	},

} );
