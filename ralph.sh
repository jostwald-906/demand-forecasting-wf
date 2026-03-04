#!/bin/bash
for ((i=1; i<=$1; i++)); do
  # Runs Claude, tells it to read the plan, do one task, and commit
  result=$(claude -p "Read PRD.md and progress.txt. Implement the next incomplete task, commit, and update progress.txt. If done, output <promise>COMPLETE</promise>.")
  echo "$result"
  if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
    exit 0
  fi
done