# Quick Start: Create Release v1.0.2

## After This PR is Merged

### Option 1: GitHub Actions (Easiest)
1. Go to https://github.com/Ruin2itive/ruin2itive-site/actions/workflows/create-release.yml
2. Click the "Run workflow" button
3. Enter version: `v1.0.2`
4. Leave "Mark as pre-release" unchecked
5. Click "Run workflow"

Done! The workflow will automatically:
- Create the git tag `v1.0.2`
- Extract release notes from CHANGELOG.md
- Create a GitHub release with title "_base.build_ v1.0.2"

### Option 2: Command Line
```bash
# Clone the repo and checkout main
git clone https://github.com/Ruin2itive/ruin2itive-site.git
cd ruin2itive-site
git checkout main
git pull

# Run the release script
./scripts/create_release.sh v1.0.2

# Follow the prompts, then create the GitHub release with:
gh release create v1.0.2 \
  --title "_base.build_ v1.0.2" \
  --notes "$(awk '/## \[1.0.2\]/,/## \[/' CHANGELOG.md | sed '1d;$d')"
```

### Option 3: Fully Manual
```bash
git tag -a v1.0.2 -m "Release v1.0.2"
git push origin v1.0.2
```

Then go to https://github.com/Ruin2itive/ruin2itive-site/releases/new?tag=v1.0.2 and:
- Set title: `_base.build_ v1.0.2`
- Copy release notes from CHANGELOG.md
- Click "Publish release"

## Verify the Release

After creating the release, verify it at:
https://github.com/Ruin2itive/ruin2itive-site/releases/tag/v1.0.2

You should see:
- Tag: v1.0.2
- Title: _base.build_ v1.0.2
- Release notes from CHANGELOG.md
- Assets: Source code (zip & tar.gz)

## For Future Releases

When you need to create v1.0.3 or later:
1. Update version in `package.json`
2. Add release notes to `CHANGELOG.md`
3. Commit the changes
4. Run the GitHub Actions workflow with the new version

That's it! The automation handles everything else.
