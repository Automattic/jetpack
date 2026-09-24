#!/usr/bin/env python3
"""Generate the onboarding panel's display copy as outlined SVG paths.

The panel's display lines are set in Söhne Breit, which is licensed to Automattic
but cannot ship as a font file. Outlining a fixed set of brand lines is the way we
get the real typeface onto the panel.

The lines are brand copy, not interface copy: they read the same in every locale by
design, exactly like a logo. That is a deliberate choice and it replaces an earlier
version that split each line into two half-sentence translatable strings, which no
translator could work with ("Tell us what you're" / "building.").

Run this after changing a line, and commit the generated file. It is a developer
tool; nothing here ships.

    pip install fonttools uharfbuzz
    python3 tools/generate-panel-type.py /path/to/SohneBreit-Buch.otf

Text is shaped through HarfBuzz so kerning and ligatures match the real typeface;
laying the glyphs out on raw advance widths loses both.
"""

import json
import subprocess
import sys
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont

# Keyed by wizard step index. Each step gets one or two lines, each rendered as its
# own SVG so they can rise independently.
LINES = {
	# Step 1 is the start screen, so its panel carries the prototype's start-screen
	# display copy rather than a line about the wizard.
	0: [ 'Grow your audience.', 'Speed up your site.', 'Keep it secure.' ],
	1: [ "Tell us what you're", 'building.' ],
	2: [ 'Only what you need.', "Nothing you don't." ],
	# Step 4 is scaffolding: nothing is turned on and nothing is saved, so the
	# panel must not say the setup is finished. Replace when the step is real.
	3: [ 'Still being built.' ],
}

OUT = Path( __file__ ).parent.parent / '_inc/components/onboarding-screen/wizard/panel-type.ts'

HEADER = '''/**
 * GENERATED FILE — do not edit by hand.
 *
 * The onboarding panel's display copy, outlined from Söhne Breit. Regenerate with
 * `tools/generate-panel-type.py` after changing a line; that script holds the copy.
 *
 * These lines are brand copy and read the same in every locale by design, so they
 * carry no `__()` call. Each entry keeps its text for the accessible name.
 */

export type PanelLine = {
\t// The words, for the accessible name and the visually hidden copy.
\ttext: string;
\t// SVG path data for the whole line, already shaped and kerned.
\tpath: string;
\t// Width as a multiple of the line box, so one font-size scales the line.
\tratio: number;
};

export const PANEL_LINES: Record< number, PanelLine[] > = '''


def shape( font, tt, glyph_set, order, text ):
	"""Return path data and advance width for one shaped line."""
	buf = hb.Buffer()
	buf.add_str( text )
	buf.guess_segment_properties()
	hb.shape( font, buf, { 'kern': True, 'liga': True } )

	x = 0
	parts = []
	for info, pos in zip( buf.glyph_infos, buf.glyph_positions ):
		pen = SVGPathPen( glyph_set )
		glyph_set[ order[ info.codepoint ] ].draw( pen )
		commands = pen.getCommands()
		if commands:
			parts.append( f'<path transform="translate({ x + pos.x_offset } { pos.y_offset })" d="{ commands }"/>' )
		x += pos.x_advance
	return ''.join( parts ), x


def main():
	if len( sys.argv ) < 2:
		sys.exit( 'usage: generate-panel-type.py /path/to/SohneBreit-Buch.otf' )

	font_path = sys.argv[ 1 ]
	blob = hb.Blob.from_file_path( font_path )
	font = hb.Font( hb.Face( blob ) )
	tt = TTFont( font_path )
	glyph_set = tt.getGlyphSet()
	order = tt.getGlyphOrder()
	ascent, descent = tt[ 'hhea' ].ascent, tt[ 'hhea' ].descent
	box = ascent - descent

	out = {}
	for step, texts in LINES.items():
		out[ step ] = []
		for text in texts:
			path, advance = shape( font, tt, glyph_set, order, text )
			out[ step ].append( {
				'text': text,
				'path': path,
				'ratio': round( advance / box, 4 ),
			} )

	body = json.dumps( out, indent = '\t', ensure_ascii = False )
	OUT.write_text( f'{ HEADER }{ body };\n' )

	# The viewBox is the same for every line, so the component holds it rather than
	# repeating it 8 times in the data.
	print( f'wrote { OUT }' )
	print( f'viewBox for the component: 0 { -ascent } WIDTH { box }' )
	print( f'ascent { ascent }  descent { descent }  box { box }' )
	print( f'{ OUT.stat().st_size / 1024:.1f} KB' )

	# Match the repo's formatting rather than leaving a generated file that fails lint.
	subprocess.run( [ 'pnpm', 'exec', 'prettier', '--write', str( OUT ) ], check = False )


if __name__ == '__main__':
	main()
