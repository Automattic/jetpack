/**
 * External dependencies
 */
import { omit } from 'lodash';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { settings as mapSettings } from './settings.js';
import edit from './edit';
import save from './save';
import './style.scss';
import './editor.scss';

export const { name } = mapSettings;

export const settings = {
	title: mapSettings.title,
	icon: mapSettings.icon,
	category: mapSettings.category,
	keywords: mapSettings.keywords,
	description: mapSettings.description,
	attributes: mapSettings.attributes,
	supports: mapSettings.supports,
	styles: mapSettings.styles,
	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		if ( -1 !== mapSettings.validAlignments.indexOf( align ) ) {
			return { 'data-align': align };
		}
	},
	edit,
	save,
	example: mapSettings.example,
	deprecated: [
		{
			attributes: omit( mapSettings.attributes, 'showFullscreenButton' ),
			migrate: attributes => ( { ...attributes, showFullscreenButton: true } ),
			save,
		},
		{
			attributes: {
				mapStyle: {
					type: 'string',
					default: 'default',
				},
				...mapSettings.attributes,
			},
			migrate: attributes => attributes,
			save: class extends Component {
				render() {
					const { attributes } = this.props;
					const {
						align,
						mapStyle,
						mapDetails,
						points,
						zoom,
						mapCenter,
						markerColor,
						scrollToZoom,
						mapHeight,
						showFullscreenButton,
					} = attributes;
					const pointsList = points.map( ( point, index ) => {
						const { longitude, latitude } = point.coordinates;
						const url =
							'https://www.google.com/maps/search/?api=1&query=' + latitude + ',' + longitude;
						return (
							<li key={ index }>
								<a href={ url }>{ point.title }</a>
							</li>
						);
					} );
					const alignClassName = align ? `align${ align }` : null;
					// All camelCase attribute names converted to snake_case data attributes
					return (
						<div
							className={ alignClassName }
							data-map-style={ mapStyle }
							data-map-details={ mapDetails }
							data-points={ JSON.stringify( points ) }
							data-zoom={ zoom }
							data-map-center={ JSON.stringify( mapCenter ) }
							data-marker-color={ markerColor }
							data-scroll-to-zoom={ scrollToZoom || null }
							data-map-height={ mapHeight || null }
							data-show-fullscreen-button={ showFullscreenButton || null }
						>
							{ points.length > 0 && <ul>{ pointsList }</ul> }
						</div>
					);
				}
			},
		},
	],
};
