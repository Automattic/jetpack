/**
 * External dependencies
 */
import { Button, TextControl } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { closeSmall, video } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { formatChapterTime, parseChapterTimeInput } from '../../utils/video-chapters/chapter-time';
/**
 * Types
 */
import type { ChapterRow, ChapterValidationError } from './chapter-workspace';
import type { KeyboardEvent, ReactElement } from 'react';

type ChapterListProps = {
	rows: ChapterRow[];
	errors: ChapterValidationError[];
	disabled: boolean;
	onSetTime: ( id: number, seconds: number ) => void;
	onSetTitle: ( id: number, title: string ) => void;
	onRemove: ( id: number ) => void;
	onSeek: ( seconds: number ) => void;
};

type ChapterRowItemProps = {
	row: ChapterRow;
	isTimePinned: boolean;
	errorMessage: string | null;
	disabled: boolean;
	onSetTime: ( id: number, seconds: number ) => void;
	onSetTitle: ( id: number, title: string ) => void;
	onRemove: ( id: number ) => void;
	onSeek: ( seconds: number ) => void;
};

const rowErrorMessage = ( errors: ChapterValidationError[], rowId: number ): string | null => {
	for ( const error of errors ) {
		if ( ! ( 'rowId' in error ) || error.rowId !== rowId ) {
			continue;
		}
		switch ( error.code ) {
			case 'gap':
				return __( 'Chapters must be at least 10 seconds apart.', 'jetpack-videopress-pkg' );
			case 'empty-title':
				return __( 'Add a title for this chapter.', 'jetpack-videopress-pkg' );
		}
	}
	return null;
};

/**
 * One editable chapter row: start time, title, preview-seek, and remove.
 *
 * The time field edits a local string and commits on blur or Enter; invalid
 * input reverts to the row's current time rather than committing.
 *
 * @param props              - Component props.
 * @param props.row          - The chapter row to render.
 * @param props.isTimePinned - Whether the time field is locked (the first row, while it sits at 0:00).
 * @param props.errorMessage - Validation message for this row, if any.
 * @param props.disabled     - Whether all controls are disabled.
 * @param props.onSetTime    - Called with (id, seconds) when a new time commits.
 * @param props.onSetTitle   - Called with (id, title) on title edits.
 * @param props.onRemove     - Called with the row id to remove it.
 * @param props.onSeek       - Called with seconds to seek the preview player.
 * @return The row element.
 */
function ChapterRowItem( {
	row,
	isTimePinned,
	errorMessage,
	disabled,
	onSetTime,
	onSetTitle,
	onRemove,
	onSeek,
}: ChapterRowItemProps ): ReactElement {
	const formattedTime = formatChapterTime( row.seconds );
	const [ timeInput, setTimeInput ] = useState( formattedTime );
	const [ hasFormatError, setHasFormatError ] = useState( false );

	/*
	 * Re-sync the local field when the committed time changes — a commit
	 * normalizes the typed format, or the workspace is re-seeded.
	 */
	useEffect( () => {
		setTimeInput( formattedTime );
	}, [ formattedTime ] );

	const commitTime = () => {
		const seconds = parseChapterTimeInput( timeInput );
		if ( seconds === null ) {
			setTimeInput( formattedTime );
			setHasFormatError( timeInput.trim() !== formattedTime );
			return;
		}
		if ( seconds === row.seconds ) {
			setTimeInput( formattedTime );
			return;
		}
		onSetTime( row.id, seconds );
	};

	const handleTimeChange = ( value: string ) => {
		setTimeInput( value );
		setHasFormatError( false );
	};

	const handleTimeKeyDown = ( event: KeyboardEvent< HTMLInputElement > ) => {
		if ( event.key === 'Enter' ) {
			event.preventDefault();
			commitTime();
		}
	};

	return (
		<li
			className={ `videopress-chapter-manager__row${
				errorMessage ? ' videopress-chapter-manager__row--invalid' : ''
			}` }
		>
			<div className="videopress-chapter-manager__row-fields">
				<div className="videopress-chapter-manager__row-time">
					<TextControl
						label={ __( 'Start time', 'jetpack-videopress-pkg' ) }
						hideLabelFromVision
						value={ timeInput }
						disabled={ disabled || isTimePinned }
						onChange={ handleTimeChange }
						onBlur={ commitTime }
						onKeyDown={ handleTimeKeyDown }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
				</div>
				<div className="videopress-chapter-manager__row-title">
					<TextControl
						label={ __( 'Title', 'jetpack-videopress-pkg' ) }
						hideLabelFromVision
						placeholder={ __( 'Chapter title', 'jetpack-videopress-pkg' ) }
						value={ row.title }
						disabled={ disabled }
						onChange={ value => onSetTitle( row.id, value ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
				</div>
				<Button
					size="small"
					icon={ video }
					label={ __( 'Preview from here', 'jetpack-videopress-pkg' ) }
					disabled={ disabled }
					onClick={ () => onSeek( row.seconds ) }
				/>
				<Button
					size="small"
					icon={ closeSmall }
					label={ __( 'Remove chapter', 'jetpack-videopress-pkg' ) }
					disabled={ disabled }
					onClick={ () => onRemove( row.id ) }
				/>
			</div>
			{ hasFormatError && (
				<p className="videopress-chapter-manager__row-error">
					{ __( 'Times use the MM:SS or H:MM:SS format.', 'jetpack-videopress-pkg' ) }
				</p>
			) }
			{ errorMessage && <p className="videopress-chapter-manager__row-error">{ errorMessage }</p> }
		</li>
	);
}

/**
 * The chapter manager's editable row list.
 *
 * @param props            - Component props.
 * @param props.rows       - Chapter rows sorted by start time.
 * @param props.errors     - Current validation errors, for row highlighting.
 * @param props.disabled   - Whether all controls are disabled.
 * @param props.onSetTime  - Called with (id, seconds) when a new time commits.
 * @param props.onSetTitle - Called with (id, title) on title edits.
 * @param props.onRemove   - Called with the row id to remove it.
 * @param props.onSeek     - Called with seconds to seek the preview player.
 * @return The list element.
 */
export default function ChapterList( {
	rows,
	errors,
	disabled,
	onSetTime,
	onSetTitle,
	onRemove,
	onSeek,
}: ChapterListProps ): ReactElement {
	return (
		<ul className="videopress-chapter-manager__rows">
			{ rows.map( ( row, index ) => (
				<ChapterRowItem
					key={ row.id }
					row={ row }
					isTimePinned={ index === 0 && row.seconds === 0 }
					errorMessage={ rowErrorMessage( errors, row.id ) }
					disabled={ disabled }
					onSetTime={ onSetTime }
					onSetTitle={ onSetTitle }
					onRemove={ onRemove }
					onSeek={ onSeek }
				/>
			) ) }
		</ul>
	);
}
