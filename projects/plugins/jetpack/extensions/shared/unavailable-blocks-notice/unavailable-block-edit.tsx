import { Warning, useBlockProps, store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock, getBlockType } from '@wordpress/blocks';
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { safeHTML } from '@wordpress/dom';
import { RawHTML, useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import type { UnavailableBlocksData, UnavailableCause } from './get-unavailable-cause';

type Props = {
	attributes: { originalUndelimitedContent?: string };
	clientId: string;
	cause: UnavailableCause;
	data: UnavailableBlocksData;
};

type Explanation = { message: string; fixLabel?: string; fixUrl?: string };

/**
 * Describe the cause, with a way to fix it for users who are able to.
 *
 * @param {UnavailableCause}      cause - Why the block is unavailable.
 * @param {UnavailableBlocksData} data  - What the server knows about unavailable blocks.
 * @return {Explanation} The message, and the fix link when there is one.
 */
function explain( cause: UnavailableCause, data: UnavailableBlocksData ): Explanation {
	if ( cause.type === 'disabled' ) {
		return {
			message: __(
				'This block is unavailable because Jetpack blocks are disabled on this site.',
				'jetpack'
			),
		};
	}

	if ( cause.type === 'not_connected' ) {
		return data.canFix
			? {
					message: __(
						'This block is unavailable because Jetpack is not connected. Reload this page after connecting it.',
						'jetpack'
					),
					fixLabel: __( 'Connect Jetpack', 'jetpack' ),
					fixUrl: data.fixUrl,
				}
			: {
					message: __(
						'This block is unavailable because Jetpack is not connected. Ask a site administrator to connect it.',
						'jetpack'
					),
				};
	}

	if ( cause.type === 'feature' ) {
		if ( cause.forced ) {
			return {
				message: sprintf(
					/* translators: %s: name of a Jetpack feature, such as "Newsletter". */
					__(
						'This Jetpack block is unavailable because the %s feature is disabled on this site.',
						'jetpack'
					),
					cause.name
				),
			};
		}

		return data.canManageModules
			? {
					message: sprintf(
						/* translators: %s: name of a Jetpack feature, such as "Newsletter". */
						__(
							'This Jetpack block is unavailable because the %s feature is turned off. Reload this page after turning it on.',
							'jetpack'
						),
						cause.name
					),
					fixLabel: __( 'Manage Jetpack features', 'jetpack' ),
					fixUrl: data.modulesUrl,
				}
			: {
					message: sprintf(
						/* translators: %s: name of a Jetpack feature, such as "Newsletter". */
						__(
							'This Jetpack block is unavailable because the %s feature is turned off. Ask a site administrator to turn it on.',
							'jetpack'
						),
						cause.name
					),
				};
	}

	return data.canFix
		? {
				message: __(
					'This block is unavailable because Jetpack Blocks is turned off. Reload this page after turning it on.',
					'jetpack'
				),
				fixLabel: __( 'Turn on Jetpack Blocks', 'jetpack' ),
				fixUrl: data.fixUrl,
			}
		: {
				message: __(
					'This block is unavailable because Jetpack Blocks is turned off. Ask a site administrator to turn it on.',
					'jetpack'
				),
			};
}

/**
 * Stand in for core's missing-block warning when Jetpack knows why the block is missing.
 *
 * @param {Props}                 props            - Component props.
 * @param {object}                props.attributes - Attributes of the `core/missing` block.
 * @param {string}                props.clientId   - Block client ID.
 * @param {UnavailableCause}      props.cause      - Why the block is unavailable.
 * @param {UnavailableBlocksData} props.data       - What the server knows about unavailable blocks.
 * @return {JSX.Element} The warning.
 */
export default function UnavailableBlockEdit( { attributes, clientId, cause, data }: Props ) {
	const { originalUndelimitedContent } = attributes;
	const canConvertToHTML = useSelect(
		select => {
			const { canInsertBlockType, getBlockRootClientId } = select( blockEditorStore );
			return (
				!! originalUndelimitedContent &&
				canInsertBlockType( 'core/html', getBlockRootClientId( clientId ) )
			);
		},
		[ clientId, originalUndelimitedContent ]
	);
	const { replaceBlock } = useDispatch( blockEditorStore );
	const convertToHTML = useCallback( () => {
		// WordPress 7.1 moved the Custom HTML block's markup from an attribute to inner content.
		const usesInnerContent = getBlockType( 'core/html' )?.attributes?.content?.role === 'local';
		replaceBlock(
			clientId,
			usesInnerContent
				? createBlock( 'core/html', {}, [], [ originalUndelimitedContent ] )
				: createBlock( 'core/html', { content: originalUndelimitedContent } )
		);
	}, [ clientId, originalUndelimitedContent, replaceBlock ] );

	const { message, fixLabel, fixUrl } = explain( cause, data );
	const actions = [];

	if ( fixUrl ) {
		actions.push(
			<Button
				__next40pxDefaultSize
				key="fix"
				variant="primary"
				href={ fixUrl }
				target="_blank"
				rel="noreferrer"
			>
				{ fixLabel }
			</Button>
		);
	}
	if ( canConvertToHTML ) {
		actions.push(
			<Button __next40pxDefaultSize key="convert" variant="secondary" onClick={ convertToHTML }>
				{ __( 'Keep as HTML', 'jetpack' ) }
			</Button>
		);
	}

	return (
		<div { ...useBlockProps( { className: 'has-warning' } ) }>
			<Warning actions={ actions }>{ message }</Warning>
			<RawHTML>{ safeHTML( originalUndelimitedContent ?? '' ) }</RawHTML>
		</div>
	);
}
