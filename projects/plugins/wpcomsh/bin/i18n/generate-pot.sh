#!/bin/bash
cd $(dirname "$(dirname "$(dirname "$0")")")

rm -f languages/wpcomsh.pot

find . -name '*.php' -and ! -path './build/*' -and ! -path './custom-colors/*' \
 -and \( \
    ! -path './vendor/*' \
    -or -path './vendor/automattic/jetpack-mu-wpcom/*' \
    -or -path './vendor/automattic/at-pressable-podcasting/*' \
    -or -path './vendor/automattic/custom-fonts-typekit/*' \
    -or -path './vendor/automattic/custom-fonts/*' \
    -or -path './vendor/automattic/jetpack-assets/*' \
    -or -path './vendor/automattic/jetpack-config/*' \
    -or -path './vendor/automattic/jetpack-post-list/*' \
 \) \
 -print \
| sed -e 's,^\./,,' \
| sort \
| xargs xgettext \
    --keyword=__ \
    --keyword=_e \
    --keyword=_c \
    --keyword=esc_attr__ \
    --keyword=esc_attr_e \
	--keyword=__ngettext:1,2 \
	--keyword=__ngettext_noop:1,2 \
	--keyword=_n:1,2 \
	--keyword=_n_noop:1,2 \
	--keyword=_nc:1,2 \
	--keyword=_x:1,2c \
	--keyword=_ex:1,2c \
	--keyword=esc_attr_x:1,2c \
	--keyword=esc_html__ \
	--keyword=esc_html_e \
	--keyword=esc_html_x:1,2c \
	--keyword=_nx:1,2,4c \
	--keyword=_nx_noop:1,2,3c \
	--language=php \
	--output=languages/wpcomsh.pot \
	--from-code utf-8 \
	--add-comments=translators \
	--copyright-holder=Automattic \
	--msgid-bugs-address=help@wordpress.com \
	--package-name="WP.com Site Helper" \

echo '

#. Plugin Name of the plugin
msgid "WP.com Site Helper"
msgstr ""

#. Description of the plugin
msgid "WordPress.com provided functionality & tools pre-installed and activated on all Atomic Sites"
msgstr ""
' >> languages/wpcomsh.pot

if [ -e languages/wpcomsh.pot ]; then
	echo 'languages/wpcomsh.pot file was generated.'
else
	echo 'The file languages/wpcomsh.pot was not generated. Please check the output above.'
fi
