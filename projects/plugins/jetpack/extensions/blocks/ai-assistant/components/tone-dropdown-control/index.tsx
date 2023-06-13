/*
 * External dependencies
 */
import {
	MenuItem,
	MenuGroup,
	ToolbarDropdownMenu,
	DropdownMenu,
	Icon,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { chevronDown } from '@wordpress/icons';
import React from 'react';
/**
 * Internal dependencies
 */
import speakToneIcon from '../../icons/speak-tone';

const PROMPT_TONES_LIST = [
	'formal',
	'informal',
	'optimistic',
	// 'pessimistic',
	'humorous',
	'serious',
	'skeptical',
	'empathetic',
	// 'enthusiastic',
	// 'neutral',
	'confident',
	// 'curious',
	// 'respectful',
	'passionate',
	// 'cautious',
	'provocative',
	// 'inspirational',
	// 'satirical',
	// 'dramatic',
	// 'mysterious',
] as const;

export const DEFAULT_PROMPT_TONE = 'formal';

export const PROMPT_TONES_MAP = {
	formal: {
		label: __( 'Formal', 'jetpack' ),
		emoji: '🎩',
	},
	informal: {
		label: __( 'Informal', 'jetpack' ),
		emoji: '😊',
	},
	optimistic: {
		label: __( 'Optimistic', 'jetpack' ),
		emoji: '😃',
	},
	// pessimistic: {
	// 	label: __( 'Pessimistic', 'jetpack' ),
	// 	emoji: '☹️',
	// },
	humorous: {
		label: __( 'Humorous', 'jetpack' ),
		emoji: '😂',
	},
	serious: {
		label: __( 'Serious', 'jetpack' ),
		emoji: '😐',
	},
	skeptical: {
		label: __( 'Skeptical', 'jetpack' ),
		emoji: '🤨',
	},
	empathetic: {
		label: __( 'Empathetic', 'jetpack' ),
		emoji: '💗',
	},
	// enthusiastic: {
	// 	label: __( 'Enthusiastic', 'jetpack' ),
	// 	emoji: '🤩',
	// },
	// neutral: {
	// 	label: __( 'Neutral', 'jetpack' ),
	// 	emoji: '😶',
	// },
	confident: {
		label: __( 'Confident', 'jetpack' ),
		emoji: '😎',
	},
	// curious: {
	// 	label: __( 'Curious', 'jetpack' ),
	// 	emoji: '🧐',
	// },
	// respectful: {
	// 	label: __( 'Respectful', 'jetpack' ),
	// 	emoji: '🙏',
	// },
	passionate: {
		label: __( 'Passionate', 'jetpack' ),
		emoji: '❤️',
	},
	// cautious: {
	// 	label: __( 'Cautious', 'jetpack' ),
	// 	emoji: '🚧',
	// },
	provocative: {
		label: __( 'Provocative', 'jetpack' ),
		emoji: '🔥',
	},
	// inspirational: {
	// 	label: __( 'Inspirational', 'jetpack' ),
	// 	emoji: '✨',
	// },
	// satirical: {
	// 	label: __( 'Satirical', 'jetpack' ),
	// 	emoji: '🃏',
	// },
	// dramatic: {
	// 	label: __( 'Dramatic', 'jetpack' ),
	// 	emoji: '🎭',
	// },
	// mysterious: {
	// 	label: __( 'Mysterious', 'jetpack' ),
	// 	emoji: '🔮',
	// },
};

export type ToneProp = ( typeof PROMPT_TONES_LIST )[ number ];

type ToneDropdownMenuControlProps = {
	value: ToneProp;
	onChange: ( value: string ) => void;
};

const ToneMenuGroup = ( { value, onChange }: ToneDropdownMenuControlProps ) => (
	<MenuGroup label={ __( 'Select tone', 'jetpack' ) }>
		{ PROMPT_TONES_LIST.map( tone => {
			return (
				<MenuItem
					key={ `key-${ tone }` }
					onClick={ () => onChange( tone ) }
					isSelected={ value === tone }
				>
					{ `${ PROMPT_TONES_MAP[ tone ].emoji } ${ PROMPT_TONES_MAP[ tone ].label }` }
				</MenuItem>
			);
		} ) }
	</MenuGroup>
);

export function ToneDropdownControl( {
	value = DEFAULT_PROMPT_TONE,
	onChange,
}: ToneDropdownMenuControlProps ) {
	return (
		<DropdownMenu
			icon={ speakToneIcon }
			label={ __( 'Change tone', 'jetpack' ) }
			popoverProps={ {
				variant: 'toolbar',
			} }
			toggleProps={ {
				children: (
					<>
						<div>{ __( 'Change tone', 'jetpack' ) }</div>
						<Icon icon={ chevronDown } />
					</>
				),
			} }
		>
			{ () => <ToneMenuGroup value={ value } onChange={ onChange } /> }
		</DropdownMenu>
	);
}

export default function ToneDropdownMenuControl( {
	value = DEFAULT_PROMPT_TONE,
	onChange,
}: ToneDropdownMenuControlProps ) {
	return (
		<ToolbarDropdownMenu
			icon={ speakToneIcon }
			label={ __( 'Change tone', 'jetpack' ) }
			popoverProps={ {
				variant: 'toolbar',
			} }
		>
			{ () => <ToneMenuGroup value={ value } onChange={ onChange } /> }
		</ToolbarDropdownMenu>
	);
}
