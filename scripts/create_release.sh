#!/bin/bash
# Script to create a new release
# Usage: ./scripts/create_release.sh <version>
# Example: ./scripts/create_release.sh v1.0.2

set -e

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "Usage: $0 <version>"
  echo "Example: $0 v1.0.2"
  exit 1
fi

# Validate version format
if [[ ! "$VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Error: Version must be in format vX.Y.Z (e.g., v1.0.2)"
  exit 1
fi

# Check if tag already exists
if git rev-parse "$VERSION" >/dev/null 2>&1; then
  echo "Error: Tag $VERSION already exists"
  exit 1
fi

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "Warning: You are on branch '$CURRENT_BRANCH', not 'main'"
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Extract version number without 'v' prefix
VERSION_NUM="${VERSION#v}"

# Check if package.json version matches
if [ -f "package.json" ]; then
  PACKAGE_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "")
  if [ -n "$PACKAGE_VERSION" ] && [ "$PACKAGE_VERSION" != "$VERSION_NUM" ]; then
    echo "Warning: package.json version ($PACKAGE_VERSION) doesn't match release version ($VERSION_NUM)"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      exit 1
    fi
  fi
fi

# Extract changelog for this version
if [ -f "CHANGELOG.md" ]; then
  CHANGELOG=$(awk "/## \[$VERSION_NUM\]/,/## \[/" CHANGELOG.md | sed '1d;$d')
  if [ -z "$CHANGELOG" ]; then
    echo "No changelog entry found for version $VERSION_NUM"
    CHANGELOG="Release $VERSION"
  fi
else
  echo "No CHANGELOG.md file found"
  CHANGELOG="Release $VERSION"
fi

echo "Creating release $VERSION"
echo "Changelog:"
echo "$CHANGELOG"
echo ""

read -p "Proceed with creating release? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  exit 1
fi

# Create and push tag
echo "Creating git tag..."
git tag -a "$VERSION" -m "Release $VERSION"
git push origin "$VERSION"

echo ""
echo "Tag $VERSION created and pushed successfully!"
echo ""
echo "To create the GitHub release, use one of these methods:"
echo "1. Run: gh release create $VERSION --title '_base.build_ $VERSION' --notes '$CHANGELOG'"
echo "2. Or go to: https://github.com/Ruin2itive/ruin2itive-site/releases/new?tag=$VERSION"
echo "3. Or use the 'Create Release' workflow in GitHub Actions"
