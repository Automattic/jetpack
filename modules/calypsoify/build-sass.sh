#!/bin/bash

sass style.scss | perl -pe 's/^    /\t\t/g' | perl -pe 's/^  /\t/g' > style.css
sass style-gutenberg.scss | perl -pe 's/^    /\t\t/g' | perl -pe 's/^  /\t/g' > style-gutenberg.css
