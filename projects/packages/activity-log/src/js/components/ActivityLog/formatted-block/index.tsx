/**
 * Renders the structured tokens produced by the parser.
 *
 * Ported (simplified) from Calypso's logs-activity-formatted-block. In the
 * wp-admin context we can't resolve Calypso routes like /reader/blogs/…,
 * /people/edit/…, or /plugins/… — those renderers fall through to their
 * children (plain strong text). Direct URL ranges (release notes, docs) still
 * render as external links, which covers the common case visible in the
 * screenshot (e.g. "Gutenberg 23.0.0 ↗").
 */
import { ExternalLink } from '@wordpress/components';
import { Fragment, type MouseEvent, type ReactNode } from 'react';
import type { ActivityBlockContent, ActivityBlockMeta, ActivityBlockNode } from './types';

type BlockClickHandler = ( event: MouseEvent< HTMLAnchorElement > ) => void;

type BlockRenderer = ( args: {
	content: ActivityBlockNode;
	children: ReactNode[];
	onClick: BlockClickHandler | undefined;
	meta: ActivityBlockMeta;
} ) => ReactNode;

interface FormattedBlockProps {
	content: ActivityBlockContent;
	onClick: BlockClickHandler | undefined;
	meta: ActivityBlockMeta;
}

const Strong = ( { children }: { children: ReactNode } ) => <strong>{ children }</strong>;
const Emphasis = ( { children }: { children: ReactNode } ) => <em>{ children }</em>;
const Preformatted = ( { children }: { children: ReactNode } ) => <pre>{ children }</pre>;
const FilePath = ( { children }: { children: ReactNode } ) => (
	<div>
		<code>{ children }</code>
	</div>
);

const Link: BlockRenderer = ( { content, children, onClick, meta } ) => {
	const { url, activity, section, intent } = content;

	if ( ! url ) {
		return <Fragment>{ children }</Fragment>;
	}

	return (
		<ExternalLink
			href={ url }
			onClick={ onClick }
			data-activity={ activity ?? meta.activity }
			data-section={ section ?? meta.section }
			data-intent={ intent ?? meta.intent }
		>
			{ children }
		</ExternalLink>
	);
};

// Entity renderers (post/comment/person/plugin/theme/backup) render children
// only — the in-admin equivalents would need the plugin itself (e.g. Backup)
// to expose a known route, which we don't have a generic hook for yet.
const EntityAsStrong: BlockRenderer = ( { children } ) => <strong>{ children }</strong>;
const EntityAsFragment: BlockRenderer = ( { children } ) => <Fragment>{ children }</Fragment>;

const blockTypeMapping: Record< string, BlockRenderer > = {
	b: ( { children } ) => <Strong>{ children }</Strong>,
	strong: ( { children } ) => <Strong>{ children }</Strong>,
	i: ( { children } ) => <Emphasis>{ children }</Emphasis>,
	em: ( { children } ) => <Emphasis>{ children }</Emphasis>,
	pre: ( { children } ) => <Preformatted>{ children }</Preformatted>,
	a: Link,
	link: Link,
	filepath: ( { children } ) => <FilePath>{ children }</FilePath>,
	post: EntityAsFragment,
	comment: EntityAsFragment,
	person: EntityAsStrong,
	plugin: EntityAsFragment,
	theme: EntityAsFragment,
	backup: EntityAsFragment,
};

export const createFormattedBlock = ( mapping: Record< string, BlockRenderer > ) => {
	const FormattedBlock = ( { content, onClick, meta }: FormattedBlockProps ): ReactNode => {
		if ( typeof content === 'string' ) {
			return <>{ content }</>;
		}

		const nestedContent = content.children ?? [];
		const { type, text } = content;

		if ( type === undefined && nestedContent.length === 0 ) {
			return text ? <>{ text }</> : null;
		}

		const children = nestedContent.map( ( child, index ) => (
			<FormattedBlock key={ index } content={ child } onClick={ onClick } meta={ meta } />
		) );

		if ( type ) {
			const renderer = mapping[ type ];
			if ( renderer ) {
				return renderer( { content, children, onClick, meta } );
			}
		}

		return <>{ children }</>;
	};

	return FormattedBlock;
};

const FormattedBlock = createFormattedBlock( blockTypeMapping );

export const renderFormattedContent = ( {
	items,
	onClick = null,
	meta = {},
}: {
	items: ActivityBlockContent[];
	onClick?: BlockClickHandler | null;
	meta?: ActivityBlockMeta;
} ): ReactNode[] =>
	items.map( ( item, index ) => (
		<FormattedBlock key={ index } content={ item } onClick={ onClick ?? undefined } meta={ meta } />
	) );

export default FormattedBlock;
