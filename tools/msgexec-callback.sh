#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

# https://www.gnu.org/software/gettext/manual/html_node/msgexec-Invocation.html
# During each command invocation, the environment variable MSGEXEC_MSGID is bound
# to the message’s msgid, and the environment variable MSGEXEC_LOCATION is bound
# to the location in the PO file of the message. If the message has a context,
# the environment variable MSGEXEC_MSGCTXT is bound to the message’s msgctxt, otherwise
# it is unbound. If the message has a plural form, environment variable MSGEXEC_MSGID_PLURAL
# is bound to the message’s msgid_plural and MSGEXEC_PLURAL_FORM is bound to the
# order number of the plural actually processed (starting with 0), otherwise both are unbound.
# If the message has a previous msgid (added by msgmerge), environment variable
# MSGEXEC_PREV_MSGCTXT is bound to the message’s previous msgctxt,
# MSGEXEC_PREV_MSGID is bound to the previous msgid, and MSGEXEC_PREV_MSGID_PLURAL
# is bound to the previous msgid_plural.

MSGEXEC_MSGID=$( echo "$MSGEXEC_MSGID" | sed "s/'/\\\'/g" )

if [[ ! -v MSGEXEC_PLURAL_FORM ]]
then

    # This is not a plural message form

    if [[ -v MSGEXEC_MSGCTXT ]]
    then
        echo "_x('$MSGEXEC_MSGID','$MSGEXEC_MSGCTXT','jetpack'),";
    else
        echo "__('$MSGEXEC_MSGID','jetpack'),";
    fi

elif [[ "$MSGEXEC_PLURAL_FORM" -eq "0" ]]
then

    # This is the first in the series of two plural messages, here we begin output

    if [[ -v MSGEXEC_MSGCTXT ]]
    then
        echo "_nx('$MSGEXEC_MSGID',";
    else
        echo "_n('$MSGEXEC_MSGID',";
    fi

elif [[ "$MSGEXEC_PLURAL_FORM" -eq "1" ]]
then
    # This is the second in the series of two plural messages, here we end output

    MSGEXEC_MSGID_PLURAL=$( echo "$MSGEXEC_MSGID_PLURAL" | sed "s/'/\\\'/g" )

    if [[ -v MSGEXEC_MSGCTXT ]]
    then
        echo "'$MSGEXEC_MSGID_PLURAL','$MSGEXEC_MSGCTXT','jetpack'),";
    else
        echo "'$MSGEXEC_MSGID_PLURAL','jetpack'),";
    fi
fi
