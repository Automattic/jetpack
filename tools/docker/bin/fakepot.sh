#!/bin/bash

set -eo pipefail

source /usr/local/src/jetpack-monorepo/tools/includes/chalk-lite.sh
source /usr/local/src/jetpack-monorepo/tools/includes/plugin-functions.sh

if [[ -z "$1" || "$1" == "-h" || "$1" == "--help" ]]; then
	cat <<-EOF
		USAGE: $0 <plugin_dir>

		This is a script, intended to be run inside the Jetpack Docker environment,
		to create plugin translations for two fake languages.

		 - en_piglatin: All messages are translated into Pig Latin.
		 - en_rtl: All messages will display backwards, and the interface will be
		   right-to-left.

		Once you have run the script, in WordPress Admin > Settings > General you
		should see the above two languages as options for "Site Language".

		Note WordPress itself is not translated as described, the translations are
		only created for messages in the specified plugin.

		This is intended for testing i18n of new interfaces, or testing i18n
		generation, or the like.
	EOF
	exit
fi

PLUGIN_DIR="$1"
find_plugin_file
info "Found plugin file $PLUGIN_FILE"

DOMAIN="$(sed -n -E 's/^ \* Text Domain: ([a-zA-Z0-9_-]+)[ \t]*$/\1/p' "$PLUGIN_FILE")"
[[ -n "$DOMAIN" ]] || die "Couldn't find text domain in $PLUGIN_FILE"
info "Found text domain $DOMAIN"

TMPDIR="$(mktemp --tmpdir -d fakepot.XXXXXXX)"
function do_cleanup {
	info "Cleaning up $TMPDIR"
	rm -rf "$TMPDIR"
}
trap "do_cleanup" EXIT INT TERM

# This should match similar logic in .github/files/build-all-projects.sh
info "Copying build files for plugin"
OLDDIR="$(pwd)";
cd "$PLUGIN_DIR"
mkdir "$TMPDIR/plugin"
{
	# Include unignored files by default.
	git -c core.quotepath=off ls-files
	# Include ignored files that are tagged as production-include.
	git -c core.quotepath=off ls-files --others --ignored --exclude-standard | git -c core.quotepath=off check-attr --stdin production-include | sed -n 's/: production-include: \(unspecified\|unset\)$//;t;s/: production-include: .*//p'
} |
	# Remove all files tagged with production-exclude. This can override production-include.
	git -c core.quotepath=off check-attr --stdin production-exclude | sed -n 's/: production-exclude: \(unspecified\|unset\)$//p' |
	# Copy the resulting list of files into the clone.
	xargs cp -d --parents --target-directory="$TMPDIR/plugin"
cd "$OLDDIR"

info "Creating POT file"
mkdir "$TMPDIR/pot"
php -d memory_limit=2G $(command -v wp) --allow-root --debug i18n make-pot "$TMPDIR/plugin/" "$TMPDIR/pot/$DOMAIN.pot"

info "Making translations"
cat <<EOF > "$TMPDIR/pot/en_piglatin.po"
# Dummy po file.
msgid ""
msgstr ""
"PO-Revision-Date: $(date +'%F %T%z')\n"
"MIME-Version: 1.0\n"
"Content-Type: text/plain; charset=UTF-8\n"
"Content-Transfer-Encoding: 8bit\n"
"Plural-Forms: nplurals=2; plural=n != 1;\n"
"Language: en_piglatin\n"

EOF
cat <<EOF > "$TMPDIR/pot/en_rtl.po"
# Dummy po file.
msgid ""
msgstr ""
"PO-Revision-Date: $(date +'%F %T%z')\n"
"MIME-Version: 1.0\n"
"Content-Type: text/plain; charset=UTF-8\n"
"Content-Transfer-Encoding: 8bit\n"
"Plural-Forms: nplurals=2; plural=n != 1;\n"
"Language: en_rtl\n"

msgctxt "text direction"
msgid "ltr"
msgstr "rtl"
EOF

mkdir "$TMPDIR/js"
cd "$TMPDIR/js"
echo '{}' > package.json
pnpm add gettext-parser
node - -- "$DOMAIN" "$TMPDIR/pot" <<'EOJ'
        const [ domain, dir ] = process.argv.slice( 3 );
        const path = require( 'path' );
        const fs = require( 'fs' );
        const { po } = require( 'gettext-parser' );

        const data = po.parse( fs.readFileSync( path.resolve( dir, `${ domain }.pot` ) ) );

	function transform( cb ) {
		for ( const k1 in data.translations ) {
			for ( const k2 in data.translations[k1] ) {
				if ( k2 === '' ) {
					continue;
				}
				const v = data.translations[k1][k2];
				v.msgstr = [];
				v.msgstr.push( cb( v.msgid ) );
				if ( v.msgid_plural ) {
					v.msgstr.push( cb( v.msgid_plural ) );
				}
			}
		}
	}

	function to_piglatin( s ) {
		let ret = '';
		while ( s.length > 0 ) {
			let m;
			if ( m = s.match( /^([b-df-hj-np-tv-z]+)([aeiou][a-z]*)/i ) ) {
				ret += `${ m[2] }-${ m[1] }ay`;
			} else if ( m = s.match( /^[a-z]+/i ) ) {
				ret += m[0] + '-way';
			} else if ( m = s.match( /^<[^>]*>/i ) ) {
				ret += m[0];
			} else if ( m = s.match( /^%(?:\d+\$)?(?:[-+ 0]|\'.)*\d*(?:\.\d+)?[%bcdeEfFgGhHosuxX]/ ) ) {
				ret += m[0];
			} else if ( m = s.match( /^[<%][^a-z<%]*/i ) ) {
				ret += m[0];
			} else if ( m = s.match( /^[^a-z<%]+/i ) ) {
				ret += m[0];
			} else {
				console.log( "WTF?", s );
			}
			s = s.slice( m[0].length );
		}
		return ret;
	}

	function to_rtl( s ) {
		let ret = '';
		while ( s.length > 0 ) {
			let m;
			if ( m = s.match( /^[a-z]+/i ) ) {
				ret += `\u{202e}${ m[0] }\u{202c}`;
			} else if ( m = s.match( /^<[^>]*>/i ) ) {
				ret += m[0];
			} else if ( m = s.match( /^%(?:\d+\$)?(?:[-+ 0]|\'.)*\d*(?:\.\d+)?[%bcdeEfFgGhHosuxX]/ ) ) {
				ret += m[0];
			} else if ( m = s.match( /^[<%][^a-z<%]*/i ) ) {
				ret += m[0];
			} else if ( m = s.match( /^[^a-z<%]+/i ) ) {
				ret += m[0];
			} else {
				console.log( "WTF?", s );
			}
			s = s.slice( m[0].length );
		}
		return ret;
	}

	transform( to_piglatin );
	fs.writeFileSync( path.resolve( dir, `${ domain }-en_piglatin.po` ), po.compile( data, { foldLength: 0 } ) );

	transform( to_rtl );
	fs.writeFileSync( path.resolve( dir, `${ domain }-en_rtl.po` ), po.compile( data, { foldLength: 0 } ) );
EOJ
rm "$TMPDIR/pot/$DOMAIN.pot"

info "Extracting JS translations"
wp --allow-root --debug i18n make-json "$TMPDIR/pot/"

info "Creating MO files"
wp --allow-root --debug i18n make-mo "$TMPDIR/pot/"

info "Copying translations into /var/www/html/wp-content/languages/plugins/"
mkdir -p /var/www/html/wp-content/languages/plugins/
rm -f "/var/www/html/wp-content/languages/plugins/$DOMAIN-en_"*
cp "$TMPDIR/pot/$DOMAIN-en"* "/var/www/html/wp-content/languages/plugins/"
cp "$TMPDIR/pot/en_"* "/var/www/html/wp-content/languages/"
