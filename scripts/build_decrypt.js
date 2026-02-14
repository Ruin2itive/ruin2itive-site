name: Update Decrypt Feed

on:
  workflow_dispatch:
  schedule:
    - cron: "0 * * * *"   # once per hour, on the hour

permissions:
  contents: write

concurrency:
  group: update-decrypt
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install deps
        run: npm ci

      - name: Build decrypt.json
        run: node scripts/build_decrypt.js

      - name: Commit if changed
        run: |
          git config user.name "ruin2itive-bot"
          git config user.email "actions@users.noreply.github.com"
          git add data/decrypt.json
          if git diff --cached --quiet; then
            echo "No changes."
            exit 0
          fi
          git commit -m "Update decrypt.json"
          git push
