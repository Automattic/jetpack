/**
 * Renders the structured tokens produced by the parser.
 *
 * Ported (simplified) from Calypso's logs-activity-formatted-block. Calypso
 * links entities into its own routes (/reader/blogs/…, /people/edit/…,
 * /plugins/…); in wp-admin we link into the equivalent core screens
 * (post.php, user-edit.php, plugins.php, themes.php, comment.php) via
 * `buildAdminLink`. Entities without a wp-admin equivalent (site, backup)
 * fall through to plain strong text. Direct URL ranges (release notes,
 * docs) still render as external links.
 */
import { ExternalLink } from '@wordpress/components';
import { Fragment, type MouseEvent, type ReactNode } from 'react';
import { buildAdminLink } from '../admin-links';
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

// Resolve a token's wp-admin destination (if any). Entities without a
// target (site, backup, or a malformed payload missing an id/slug) fall
// through to plain strong text. Wrapping the label in <strong> keeps the
// entity visually emphasized whether or not it resolved to a link.
const EntityLink: BlockRenderer = ( { content, children } ) => {
	const href = buildAdminLink( content );
	if ( ! href ) {
		return <strong>{ children }</strong>;
	}
	return (
		<a href={ href }>
			<strong>{ children }</strong>
		</a>
	);
};

const EntityAsStrong: BlockRenderer = ( { children } ) => <strong>{ children }</strong>;

const blockTypeMapping: Record< string, BlockRenderer > = {
	b: ( { children } ) => <Strong>{ children }</Strong>,
	strong: ( { children } ) => <Strong>{ children }</Strong>,
	i: ( { children } ) => <Emphasis>{ children }</Emphasis>,
	em: ( { children } ) => <Emphasis>{ children }</Emphasis>,
	pre: ( { children } ) => <Preformatted>{ children }</Preformatted>,
	a: Link,
	link: Link,
	filepath: ( { children } ) => <FilePath>{ children }</FilePath>,
	post: EntityLink,
	comment: EntityLink,
	person: EntityLink,
	plugin: EntityLink,
	theme: EntityLink,
	// site (we're already on it) and backup (needs the Backup plugin's own
	// route) have no generic wp-admin target — render as plain strong text.
	site: EntityAsStrong,
	backup: EntityAsStrong,
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
