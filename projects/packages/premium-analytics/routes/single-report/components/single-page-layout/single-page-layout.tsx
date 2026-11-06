/**
 * External dependencies
 */
import { DataForm } from '@jetpack-premium-analytics/externals';
import { SectionHeader } from '@jetpack-premium-analytics/ui';
import { useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import styles from './single-page-layout.module.scss';
import type { Field } from '@jetpack-premium-analytics/externals';
import type { JSX, ReactNode } from 'react';

// The controls render in a row beside the title, without labels.
const CONTROL_LAYOUT = { type: 'regular', labelPosition: 'none' } as const;
const FORM_LAYOUT = { type: 'row', alignment: 'center' } as const;

export type SinglePageLayoutProps = {
	/*
	 * Beside the title: the entity's media, or the page's icon.
	 */
	visual?: ReactNode;

	/*
	 * The entity's title; a string also becomes the heading's hover text.
	 */
	title?: ReactNode;

	/*
	 * The line under the title: what the entity is, what window the page reports over.
	 */
	subTitle?: ReactNode;

	/*
	 * Whether the header is still resolving.
	 */
	busy?: boolean;

	/*
	 * The fields of the page's controls, rendered in the header; none for a page without controls.
	 */
	controls?: Field< never >[];

	/*
	 * The item the controls edit: the report window and the All time anchor.
	 */
	data?: Record< string, unknown >;

	/*
	 * Receives the edits a control commits.
	 */
	onChange?: ( edits: Record< string, unknown > ) => void;

	/*
	 * The page body: the widgets, a notice.
	 */
	children: ReactNode;
};

/**
 * The body of a single-report page under `Page`: a pinned header with the entity's visual,
 * title, subtitle and controls, and the content scrolling under it.
 *
 * @param {SinglePageLayoutProps} props - The props.
 * @return The layout.
 */
export function SinglePageLayout( {
	visual,
	title,
	subTitle,
	busy = false,
	controls,
	data,
	onChange,
	children,
}: SinglePageLayoutProps ): JSX.Element {
	const form = useMemo(
		() => ( {
			layout: FORM_LAYOUT,
			fields: ( controls ?? [] ).map( field => ( { id: field.id, layout: CONTROL_LAYOUT } ) ),
		} ),
		[ controls ]
	);

	return (
		<div className={ styles.scroll }>
			<SectionHeader
				pinned
				busy={ busy }
				visual={ visual ?? <span /> }
				title={ title }
				subTitle={ subTitle }
			>
				{ controls?.length && data && onChange ? (
					<DataForm
						data={ data }
						fields={ controls as never }
						form={ form }
						onChange={ onChange }
					/>
				) : null }
			</SectionHeader>

			<div className={ styles.content }>{ children }</div>
		</div>
	);
}
