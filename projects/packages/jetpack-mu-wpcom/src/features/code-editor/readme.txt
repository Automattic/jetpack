=== A8C Code Editor ===
Contributors: jonsurrell, dmsnell
Tags: Code editor
Requires at least: 6.7
Tested up to: 6.8
Stable tag: 2.2
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
Text Domain: a8c-code-editor

Modernize the WordPress code-editing experience.

== Changelog ==

= Unreleased =

= 2.2 =

* Editors: Handle [Tab] key inside the code and CSS editors.
* Block: Remove the block for development in its own project.
* Remove block delimiter syntax highlighting.
* Update the syntax highlighting styles and colors.

= 2.1 =

* Editors: Ensure code editors have a legible default text color.

= 2.0 =

* Editors: Fix an issue where redundant baseTheme styles were added.

= 1.9 =

* Block: Prevent code visibility beneath line numbers when scrolling.
* Block: Prevent theme styles from breaking block appearance and layout.
* Add enhanced CSS editing to the per-block CSS style editor.
* Wrap long lines in the Code and CSS editors.
* Improve Code and CSS editor styling to match the inputs they replace.

= 1.8 =

* Improve select-all handling in code block.
* Fix styling of the selected line in the editor when the block is not selected.
* Handle block transforms for *.log files.
* Exit the code block when three empty lines are added consecutively to the end of the block.
* Respect users' "disable syntax highlighting when editing code" setting.
* Remove the block when backspaced is pressed in an empty code block.
* Add more blocks supports to allow configuration and styling.
* Add Code Block Pro transform.
* Rework the block structure according to designs.
* Add a code editor for the Additional CSS panel in the site editor.
* Ensure the code editor works on the Site Editor.
* Add filters to enable or disable code editors:
  - `a8c_code_editor_should_load_code_editor` - Whether to load the Post and Site code editors.
  - `a8c_code_editor_should_load_css_editor` - Whether to load the Additional CSS code editor.
* Disable Monaspace font.

= 1.7 =

* Fix an issue that prevented langauge selection from being applied.
* Change attribute `languageCertainty` to `languageConfidence`.

= 1.6 =

* Fix an issue that caused block transforms to always have empty content.
* Use meaningful script names instead of index.
* Ensure that the worker script can be loaded from CDNs and does not cause errors.
* Add warning to block in the editor about experimental status.
* Prevent shortcode rendering inside code blocks.
* Add transform to core/code block.

= 1.5 =

* Realease with basic feature set:
  - Syntax Highlighting in the block editor's code editor view.
  - Code block.

= 1.0 =

* Prototype.
