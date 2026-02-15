# Release Process

This document describes how to create a new release for the ruin2itive-site project.

## Prerequisites

- Ensure all changes are committed and pushed to the `main` branch
- Update the version in `package.json`
- Update the `CHANGELOG.md` with release notes

## Creating a Release

There are three ways to create a release:

### Option 1: Using GitHub Actions (Recommended)

1. Go to the [Actions tab](https://github.com/Ruin2itive/ruin2itive-site/actions)
2. Select the "Create Release" workflow
3. Click "Run workflow"
4. Enter the version (e.g., `v1.0.2`)
5. Optionally mark as pre-release
6. Click "Run workflow"

The workflow will:
- Validate the version format
- Check if the tag already exists
- Verify version matches package.json
- Extract changelog notes
- Create a git tag
- Create a GitHub release

### Option 2: Using the Release Script

From the repository root:

```bash
./scripts/create_release.sh v1.0.2
```

This script will:
- Validate the version format
- Check for existing tags
- Verify you're on the main branch (with option to override)
- Check package.json version matches
- Extract changelog for the version
- Create and push a git tag
- Provide instructions for creating the GitHub release

### Option 3: Manual Process

1. Create a git tag:
   ```bash
   git tag -a v1.0.2 -m "Release v1.0.2"
   git push origin v1.0.2
   ```

2. Create GitHub release:
   - Go to https://github.com/Ruin2itive/ruin2itive-site/releases/new
   - Select the tag you just created
   - Set title to `_base.build_ v1.0.2`
   - Copy release notes from CHANGELOG.md
   - Click "Publish release"

   Or use GitHub CLI:
   ```bash
   gh release create v1.0.2 \
     --title "_base.build_ v1.0.2" \
     --notes "Release notes here..."
   ```

## Version Numbering

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** version (X.0.0) - incompatible API changes
- **MINOR** version (0.X.0) - new functionality, backwards compatible
- **PATCH** version (0.0.X) - bug fixes, backwards compatible

## Checklist Before Release

- [ ] All tests pass
- [ ] Code is merged to `main` branch
- [ ] `package.json` version is updated
- [ ] `CHANGELOG.md` is updated with release notes
- [ ] Documentation is up to date
- [ ] Release notes are clear and comprehensive

## After Release

- Verify the release appears on the [Releases page](https://github.com/Ruin2itive/ruin2itive-site/releases)
- Check that the tag was created correctly
- Announce the release if necessary
