import { Link } from '@wordpress/ui';
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

// The extra trailing slash prevents hostnames like
// `wordpress.com.malicious.example` from matching. Same guard Calypso's
// formatted-block uses.
const isWordPressDotComUrl = ( url?: string | null ): boolean =>
	!! url && url.startsWith( 'https://wordpress.com/' );

const AnchorBlock: BlockRenderer = ( { content, children, onClick, meta } ) => {
	const { url, activity, section, intent } = content;

	if ( ! url ) {
		return <Fragment>{ children }</Fragment>;
	}

	// Anchor ranges frequently carry section + id hints (e.g.
	// section: 'user', id: 42) pointing at a WordPress.com URL. Prefer
	// the local wp-admin equivalent when we can derive one, regardless
	// of the outer URL.
	const adminHref = buildAdminLink( content );
	if ( adminHref ) {
		return (
			<a href={ adminHref } onClick={ onClick }>
				{ children }
			</a>
		);
	}

	// No local equivalent. If the URL itself is a wordpress.com URL,
	// drop it — those destinations aren't useful from wp-admin and any
	// nested entity renderer (EntityLink) can still emit its own link
	// from the children tree.
	if ( isWordPressDotComUrl( url ) ) {
		return <Fragment>{ children }</Fragment>;
	}

	return (
		<Link
			openInNewTab
			href={ url }
			onClick={ onClick }
			data-activity={ activity ?? meta.activity }
			data-section={ section ?? meta.section }
			data-intent={ intent ?? meta.intent }
		>
			{ children }
		</Link>
	);
};

// Resolve a token's wp-admin destination (if any). Entities without a
// target (site, backup, or a malformed payload missing an id/slug) fall
// through to plain text.
const EntityLink: BlockRenderer = ( { content, children } ) => {
	const href = buildAdminLink( content );
	if ( ! href ) {
		return <Fragment>{ children }</Fragment>;
	}
	return <a href={ href }>{ children }</a>;
};

const blockTypeMapping: Record< string, BlockRenderer > = {
	b: ( { children } ) => <Strong>{ children }</Strong>,
	strong: ( { children } ) => <Strong>{ children }</Strong>,
	i: ( { children } ) => <Emphasis>{ children }</Emphasis>,
	em: ( { children } ) => <Emphasis>{ children }</Emphasis>,
	pre: ( { children } ) => <Preformatted>{ children }</Preformatted>,
	a: AnchorBlock,
	link: AnchorBlock,
	filepath: ( { children } ) => <FilePath>{ children }</FilePath>,
	post: EntityLink,
	comment: EntityLink,
	person: EntityLink,
	plugin: EntityLink,
	theme: EntityLink,
	// site (we're already on it) and backup (needs the Backup plugin's own
	// route) have no generic wp-admin target — render as plain text.
	site: ( { children } ) => <Fragment>{ children }</Fragment>,
	backup: ( { children } ) => <Fragment>{ children }</Fragment>,
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
