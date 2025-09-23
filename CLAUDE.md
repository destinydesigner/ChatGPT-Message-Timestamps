# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This project contains a userscript that adds timestamp display functionality to ChatGPT conversations, with the goal of converting it into a Chrome extension for broader distribution via the Chrome Web Store.

**Current State**: Tampermonkey userscript (pageHook.js)
**Target State**: Chrome extension with Manifest V3 architecture

## Project Goals (from guide.md)

1. **Convert to Chrome Extension**: Transform the userscript into a proper Chrome extension with zero permissions
2. **Chrome Web Store Distribution**: Package and submit for store approval within 48 hours
3. **Product Positioning**: "ChatGPT Message Timestamps — 在 ChatGPT 对话里显示每条消息的创建时间（本地/UTC、悬停精确到秒）"
4. **Monetization Strategy**: Open source + donations, with potential Pro version for advanced features

## Target Architecture (Chrome Extension)

### File Structure
```
chatgpt-timestamps/
├─ manifest.json          # MV3 manifest with zero permissions
├─ content.js            # DOM manipulation + UI, receives data from pageHook
├─ pageHook.js           # Injected to main world, hooks fetch/XHR, postMessage data
├─ styles.css            # Timestamp styling
├─ icons/                # 16px, 48px, 128px icons
├─ _screenshots/         # Store listing screenshots
└─ README.md
```

### Core Components

**manifest.json**:
- Manifest V3 with zero permissions for easier approval
- Host permissions only for ChatGPT domains
- Uses `world: "MAIN"` for content script execution in main world

**pageHook.js** (Main World):
- Intercepts `backend-api/conversation` API calls
- Uses postMessage to send conversation data to content script
- Minimal, focused on network interception only

**content.js** (Content Script):
- Receives conversation data via postMessage
- Handles DOM manipulation and timestamp insertion
- Uses MutationObserver for dynamic content updates
- Implements fallback injection for browser compatibility

**styles.css**:
- Lightweight styling for timestamp elements
- Hover effects for UTC display

### Key Technical Patterns

**Network Interception**:
- fetch/XHR overrides in main world context
- Targets `/backend-api/conversation` endpoints
- Graceful error handling with try/catch

**Message Processing**:
- Maps conversation data to DOM elements using multiple selector strategies
- WeakSet for duplicate prevention
- Supports both local and UTC time formats

**DOM Integration**:
- Non-intrusive timestamp insertion
- MutationObserver with requestAnimationFrame debouncing
- Multiple CSS selector fallbacks for UI version compatibility

## Development Workflow

### Local Development
1. **Load Extension**: `chrome://extensions` → Developer mode → Load unpacked
2. **Testing**: Test on both chatgpt.com and chat.openai.com
3. **Debugging**: Check console for network interception and DOM updates

### Build Process
No build tools required - direct file packaging for Chrome Web Store submission.

### Store Submission Requirements
- **Icons**: 16px, 48px, 128px PNG files
- **Screenshots**: Conversation with timestamps, hover tooltip, zero permissions
- **Privacy**: No data collection, no external requests
- **Permissions**: Host permissions only, no storage/scripting/activeTab

## Compliance & Best Practices

### Chrome Web Store Compliance
- Zero permissions except host permissions
- No data collection or external network requests
- Graceful error handling for API changes
- Domain restrictions to ChatGPT only

### Performance Considerations
- Lightweight DOM queries with selector fallbacks
- Debounced MutationObserver updates
- WeakSet for preventing duplicate processing
- Try/catch around all JSON parsing and DOM operations

## Planned Iterations

### v1.1 (Week 1)
- Settings page (requires storage permission)
- Timezone display options (local/UTC/both)
- Time format customization
- Show/hide toggle

### v1.2-1.4
- Internationalization (zh_CN, en)
- Robust selector adaptation for UI changes
- Performance optimizations
- Historical message replay support

## Common Commands

Since this is a web extension project:

- **Local Testing**: Load unpacked extension in Chrome developer mode
- **Packaging**: Zip entire directory for Web Store submission
- **Debugging**: Chrome DevTools console + extension inspection
- **Deployment**: Chrome Web Store developer dashboard submission