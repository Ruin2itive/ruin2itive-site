# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Real-time chat room feature with WebRTC/PeerJS integration
  - Dual authentication modes: Account-based and Guest-based
  - Message broadcasting with timestamps and user identification
  - XSS protection via HTML escaping
  - Rate limiting (5 messages per 10 seconds)
  - Username and email validation
  - Message history sync (last 50 messages)
  - Responsive design with glass morphism styling
  - Browser compatibility check with fallback messaging
  - Local storage for user credential persistence
  - Navigation link in main site header
  - Comprehensive documentation (CHAT_FEATURE.md)
  - Automated tests and security analysis (TESTING.md)

## [1.0.2] - 2026-02-15

### Added
- New RSS feed sources: Associated Press, Reuters, BBC, Hacker News, UFO/UAP news
- Build feeds workflow for automated RSS feed updates
- Raspberry Pi news feed integration
- Feed index system (data/index.json) for centralized feed management
- Enhanced projects section with Hackster and Raspberry Pi article integration

### Changed
- Improved feed rendering with URL validation to prevent broken links
- Enhanced app.js to filter out invalid feed items
- Updated build scripts for better error handling and reliability
- Improved home feed builder with better article filtering

### Fixed
- Fixed potential issues with missing URLs in feed items
- Improved error handling in feed processing

## [1.0.1] - 2026-02-15

### Added
- Header health indicator (LIVE/STALE/WAIT)
- Markets + Hacker populated feeds
- Baseline saved build

## [1.0.0] - 2026-02-15

### Added
- Initial release
- Base build foundation
