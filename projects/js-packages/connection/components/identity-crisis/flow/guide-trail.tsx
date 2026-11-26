import { Stack, Text, VisuallyHidden } from '@wordpress/ui';
import { useCallback, useId } from 'react';
import styles from '../styles.module.scss';
import { getGuideAnswerCopy, getGuideText } from './copy';
import TextButton from './text-button';
import type { CopyContext } from './copy';
import type { GuideTrailItem } from './steps';
import type { ReactNode } from 'react';

interface TrailButtonProps {
	item: GuideTrailItem;
	copy: CopyContext;
	disabled: boolean;
	onBackTo: ( index: number ) => void;
}

/**
 * An earlier answer, which goes back to its question.
 *
 * @param {TrailButtonProps} props - Component props.
 * @return {ReactNode} The button.
 */
function TrailButton( { item, copy, disabled, onBackTo }: TrailButtonProps ): ReactNode {
	const onClick = useCallback( () => onBackTo( item.index ), [ item.index, onBackTo ] );
	return (
		<TextButton onClick={ onClick } disabled={ disabled }>
			<VisuallyHidden>{ getGuideText( copy ).changeAnswer } </VisuallyHidden>
			{ getGuideAnswerCopy( item.answer, copy ).label }
		</TextButton>
	);
}

interface GuideTrailProps {
	items: GuideTrailItem[];
	copy: CopyContext;
	disabled: boolean;
	onBackTo: ( index: number ) => void;
}

/**
 * The guide answers given so far, each a way back to its question.
 *
 * @param {GuideTrailProps} props - Component props.
 * @return {ReactNode} The trail, or nothing before the first answer.
 */
export default function GuideTrail( {
	items,
	copy,
	disabled,
	onBackTo,
}: GuideTrailProps ): ReactNode {
	const labelId = useId();
	if ( items.length === 0 ) {
		return null;
	}
	return (
		<Stack
			render={ <nav aria-labelledby={ labelId } /> }
			direction="row"
			wrap="wrap"
			align="baseline"
			gap="xs"
		>
			<Text variant="body-sm" id={ labelId } className={ styles.hint }>
				{ getGuideText( copy ).trailLabel }
			</Text>
			<Stack
				render={ <ol /> }
				direction="row"
				wrap="wrap"
				align="baseline"
				gap="xs"
				className={ styles[ 'plain-list' ] }
			>
				{ items.map( ( item, position ) => (
					<Stack
						key={ item.index }
						render={ <Text variant="body-sm" render={ <li /> } /> }
						direction="row"
						align="baseline"
						gap="xs"
					>
						{ /* A mirrored character, so it points the other way in RTL. */ }
						{ position > 0 && <span aria-hidden="true">›</span> }
						<TrailButton item={ item } copy={ copy } disabled={ disabled } onBackTo={ onBackTo } />
					</Stack>
				) ) }
			</Stack>
		</Stack>
	);
}
