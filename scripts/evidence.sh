#!/usr/bin/env sh
# Runs one test script and saves its real output as evidence (.txt) plus a terminal-style .png.
# Usage: sh scripts/evidence.sh <npm-script> <name>      e.g. sh scripts/evidence.sh duel 03_duel_T1_header
script="$1"
name="$2"
out="Evidencias_extra/$name.txt"
NO_COLOR=1 FORCE_COLOR=0 npm run "$script" > "$out" 2>&1
code=$?
echo "EXIT=$code" >> "$out"
node scripts/terminal.mjs "$out" > /dev/null
grep -E "^ +(Test Files|Tests) " "$out"
echo "EXIT=$code"
