import { Fragment } from 'react';
import parseFilename from './parse-filename.js';
import parsePatch from './parse-patch.js';
import styles from './styles.module.scss';

const filename = ( {
	oldFileName,
	newFileName,
}: {
	oldFileName: string;
	newFileName: string;
} ): JSX.Element => {
	const { prev, next } = parseFilename( oldFileName, newFileName );

	if ( prev.prefix + prev.path === next.prefix + next.path ) {
		return (
			<Fragment>
				{ prev.prefix && (
					<span className={ styles[ 'diff-viewer__path-prefix' ] }>{ prev.prefix }</span>
				) }
				<span className={ styles[ 'diff-viewer__path' ] }>{ prev.path }</span>
			</Fragment>
		);
	}

	return (
		<Fragment>
			{ !! prev.prefix && (
				<span className={ styles[ 'diff-viewer__path-prefix' ] }>{ prev.prefix }</span>
			) }
			<span className={ styles[ 'diff-viewer__path' ] }>{ prev.path }</span>
			{ ' → ' }
			{ !! next.prefix && (
				<span className={ styles[ 'diff-viewer__path-prefix' ] }>{ next.prefix }</span>
			) }
			<span className={ styles[ 'diff-viewer__path' ] }>{ next.path }</span>
		</Fragment>
	);
};

export const DiffViewer = ( { diff } ) => (
	<div className={ styles[ 'diff-viewer' ] }>
		{ parsePatch( diff ).map( ( file, fileIndex ) => (
			<Fragment key={ fileIndex }>
				<div key={ `file-${ fileIndex }` } className={ styles[ 'diff-viewer__filename' ] }>
					{ filename( file ) }
				</div>
				<div key={ `diff-${ fileIndex }` } className={ styles[ 'diff-viewer__file' ] }>
					<div key="left-numbers" className={ styles[ 'diff-viewer__line-numbers' ] }>
						{ file.hunks.map( ( hunk, hunkIndex ) => {
							let lineOffset = 0;
							return hunk.lines.map( ( line, index ) => (
								<div key={ `${ hunkIndex }-${ index }` }>
									{ line[ 0 ] === '+' ? '\u00a0' : hunk.oldStart + lineOffset++ }
								</div>
							) );
						} ) }
					</div>
					<div key="right-numbers" className={ styles[ 'diff-viewer__line-numbers' ] }>
						{ file.hunks.map( ( hunk, hunkIndex ) => {
							let lineOffset = 0;
							return hunk.lines.map( ( line, index ) => (
								<div key={ `${ hunkIndex }-${ index }` }>
									{ line[ 0 ] === '-' ? '\u00a0' : hunk.newStart + lineOffset++ }
								</div>
							) );
						} ) }
					</div>
					<div className={ styles[ 'diff-viewer__lines' ] }>
						{ file.hunks.map( ( hunk, hunkIndex ) =>
							hunk.lines.map( ( line, index ) => {
								const output = line.slice( 1 ).replace( /^\s*$/, '\u00a0' );
								const key = `${ hunkIndex }-${ index }`;

								switch ( line[ 0 ] ) {
									case ' ':
										return <div key={ key }>{ output }</div>;

									case '-':
										return <del key={ key }>{ output }</del>;

									case '+':
										return <ins key={ key }>{ output }</ins>;

									default:
										return undefined;
								}
							} )
						) }
					</div>
				</div>
			</Fragment>
		) ) }
	</div>
);

export default DiffViewer;
