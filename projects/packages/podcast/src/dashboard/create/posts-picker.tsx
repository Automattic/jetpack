import {
	CheckboxControl,
	SearchControl,
	Spinner,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalText as Text,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useEntityRecords } from '@wordpress/core-data';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, _n, sprintf } from '@wordpress/i18n';

interface PostRecord {
	id: number;
	title?: { rendered?: string };
	date_gmt?: string;
	date?: string;
}

interface PostRow {
	id: number;
	title: string;
	date: string;
}

interface PostsPickerProps {
	selectedIds: number[];
	onChange: ( ids: number[] ) => void;
	disabled?: boolean;
	maxSelection?: number;
}

interface PostsPickerRowProps {
	row: PostRow;
	isChecked: boolean;
	disabled: boolean;
	onToggle: ( id: number ) => void;
}

const PostsPickerRow = ( { row, isChecked, disabled, onToggle }: PostsPickerRowProps ) => {
	const handleChange = useCallback( () => {
		onToggle( row.id );
	}, [ onToggle, row.id ] );

	return (
		<div className="podcast__posts-picker-row">
			<CheckboxControl
				__nextHasNoMarginBottom
				checked={ isChecked }
				disabled={ disabled }
				onChange={ handleChange }
				label={ row.title }
				help={ formatDate( row.date ) }
			/>
		</div>
	);
};

const FETCH_LIMIT = 100;

const formatDate = ( iso: string ): string => {
	if ( ! iso ) {
		return '';
	}
	const [ datePart ] = iso.split( 'T' );
	return datePart || iso;
};

const PostsPicker = ( { selectedIds, onChange, disabled, maxSelection }: PostsPickerProps ) => {
	const [ search, setSearch ] = useState( '' );

	const { records, hasResolved } = useEntityRecords< PostRecord >( 'postType', 'post', {
		status: 'publish',
		per_page: FETCH_LIMIT,
		orderby: 'date',
		order: 'desc',
		_fields: 'id,title,date',
	} );

	const rows = useMemo< PostRow[] >( () => {
		const list = records ?? [];
		return list.map( ( post: PostRecord ) => ( {
			id: post.id,
			title: decodeEntities( post.title?.rendered ?? '' ) || __( '(Untitled)', 'jetpack-podcast' ),
			date: post.date_gmt ?? post.date ?? '',
		} ) );
	}, [ records ] );

	const visible = useMemo( () => {
		const needle = search.trim().toLowerCase();
		if ( ! needle ) {
			return rows;
		}
		return rows.filter( row => row.title.toLowerCase().includes( needle ) );
	}, [ rows, search ] );

	const selectedSet = useMemo( () => new Set( selectedIds ), [ selectedIds ] );

	const toggle = useCallback(
		( id: number ) => {
			if ( selectedSet.has( id ) ) {
				onChange( selectedIds.filter( current => current !== id ) );
				return;
			}
			if ( maxSelection && selectedIds.length >= maxSelection ) {
				return;
			}
			onChange( [ ...selectedIds, id ] );
		},
		[ onChange, selectedIds, selectedSet, maxSelection ]
	);

	const clearAll = useCallback( () => onChange( [] ), [ onChange ] );

	if ( ! hasResolved ) {
		return (
			<div className="podcast__posts-picker podcast__posts-picker--loading">
				<Spinner />
			</div>
		);
	}

	const atCap = !! maxSelection && selectedIds.length >= maxSelection;
	const helpText = maxSelection
		? sprintf(
				/* translators: 1: selected count, 2: maximum allowed. */
				__( '%1$d of %2$d selected.', 'jetpack-podcast' ),
				selectedIds.length,
				maxSelection
		  )
		: sprintf(
				/* translators: %d: selected count. */
				_n( '%d post selected.', '%d posts selected.', selectedIds.length, 'jetpack-podcast' ),
				selectedIds.length
		  );

	return (
		<VStack spacing={ 2 } className="podcast__posts-picker">
			<SearchControl
				__nextHasNoMarginBottom
				label={ __( 'Search posts', 'jetpack-podcast' ) }
				value={ search }
				onChange={ setSearch }
				disabled={ disabled }
			/>
			<div className="podcast__posts-picker-list" aria-busy={ disabled }>
				{ visible.length === 0 && (
					<div className="podcast__posts-picker-empty">
						<Text variant="muted">{ __( 'No matching posts.', 'jetpack-podcast' ) }</Text>
					</div>
				) }
				{ visible.map( row => {
					const isChecked = selectedSet.has( row.id );
					return (
						<PostsPickerRow
							key={ row.id }
							row={ row }
							isChecked={ isChecked }
							disabled={ !! disabled || ( atCap && ! isChecked ) }
							onToggle={ toggle }
						/>
					);
				} ) }
			</div>
			<div className="podcast__posts-picker-footer">
				<Text variant="muted">{ helpText }</Text>
				{ selectedIds.length > 0 && ! disabled && (
					<button type="button" className="podcast__posts-picker-clear" onClick={ clearAll }>
						{ __( 'Clear selection', 'jetpack-podcast' ) }
					</button>
				) }
			</div>
		</VStack>
	);
};

export default PostsPicker;
