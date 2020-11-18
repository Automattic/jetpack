#!/bin/bash

find . \( \
	-name .git \
	-o -name vendor \
	-o -name wordpress \
	-o -name wordpress-develop \
	-o -name node_modules \
\) -prune -o -name '*.php' -print | vendor/bin/parallel-lint --stdin
