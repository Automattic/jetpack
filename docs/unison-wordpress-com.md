  # Advanced Unison Configuration

  Jetpack currently uses a `sun`/`moon` strategy where the current production files are in one folder and the "staging/test" version are in the other folder.

  If you don't want to keep track of which folder is in use during development, you can update your Unison preference file to point to `wp-content/mu-plugins/jetpack-plugin/production` on your sandbox. The `production` directory will always be pointed at the current production files.
  
  In the event that you want to sync changes to both `sun` and `moon`, you may want to create _two_ Unison preference files, one file which syncs to the `sun` location and one file which syncs to the `moon` location. Then you would run two separate instances of `unison watch` (as described above).

  For even more advanced usage, you can use the following command to launch tmux with each unison command running in a separate window.

  ```
  tmux new-session -d 'unison -ui text -repeat watch jetpack-plugin-moon' \; split-window -d 'unison -ui text -repeat watch jetpack-plugin-sun' \; attach
  ```

  Note: You will need to adjust the above command depending on the name(s) of your Unison configuration files.