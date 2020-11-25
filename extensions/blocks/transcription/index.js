/**
 * Internal dependencies
 */
import { map, reduce } from 'lodash';

/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { postComments } from '@wordpress/icons';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { getIconColor } from '../../shared/block-icons';
import attributes from './attributes';
import edit from './edit';
import save from './save';

/**
 * Style dependencies
 */
import './style.scss';

const transcriptionRegExp = new RegExp( '(\\d:\\d{2}:\\d{2}\\.\\d{3},\\d:\\d{2}:\\d{2}\\.\\d{3})' );

function formatTimeStamp( val ) {
	if ( ! val ) {
		return;
	}

	return (
		map( val.split( ':' ), v => {
			const sv = String( Math.round( Number( v ) ) );
			return sv.length < 2 ? `0${ sv }` : sv;
		} ).join( ':' )
	).replace( /^00:/, '' );
}

export const name = 'transcription';
export const title = __( 'Transcription', 'jetpack' );
export const settings = {
	title,
	description: __( 'Transcription', 'jetpack' ),
	icon: {
		src: postComments,
		foreground: getIconColor(),
	},
	category: 'layout',
	keywords: [
		_x( 'Transcription', 'block search term', 'jetpack' ),
	],
	supports: {
		'align': true,
	},
	attributes,
	edit,
	save,
	providesContext: {
		'dialogue/speakers': 'speakers',
		'dialogue/showTimeStamp': 'showTimeStamp',
	},

	transforms: {
		from: [
			{
				type: 'raw',
				isMatch: ( node ) => {
					return transcriptionRegExp.test( node.textContent );
				},
				transform: ( node ) => {
					const contentParts = ( node.innerHTML.trim() ).split( transcriptionRegExp );
					if ( contentParts[ 0 ] === '' ) {
						contentParts.shift();
					}

					if ( ! contentParts?.length ) {
						return null;
					}

					const blocksContent = reduce( contentParts, function( acc, row ) {
						if ( transcriptionRegExp.test( row ) ) {
							if ( acc[ row ] ) {
								return acc[ row ] = {
									error: 'ojo!',
								};
							}

							const startStop = row.split( ',' );

							acc[ row ] = {
								start: startStop[ 0 ],
								end: startStop[ 1 ],
								content: [],
							};

							return acc;
						}

						const currentKeys = Object.keys( acc );
						const lastKey = currentKeys[ currentKeys.length - 1 ];
						acc [ lastKey ].content.push( row );

						return acc;
					}, {} );

					const dialogueBlocks = map( blocksContent, item => {
						const innerParagraph = createBlock( 'core/paragraph', {
							content: ( item.content.join() ).replace( /^<br>/, '' ),
						} );

						return createBlock( 'jetpack/dialogue', {
							className: 'is-style-row',
							timeStamp: formatTimeStamp( item?.start ),
							timeStampEnd: formatTimeStamp( item?.end ),
							showTimeStamp: !! item?.start,
						}, [ innerParagraph ] );
					} );

					return createBlock( 'jetpack/transcription', {}, dialogueBlocks );
				},
			},
		],
	},
};
