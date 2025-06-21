# Feature Enhancement Roadmap

_This roadmap outlines planned enhancements for the ValidKit email validation library and hosted
API. It reflects our priorities based on community feedback, support tickets, and common developer
use cases._

_Last Updated: June 2025_

---

## ✅ Recently Shipped

### ✅ Disposable Email Detection (v3.1.0)

Detects and blocks throwaway/disposable email services.

- Supports 600+ providers via curated list
- Used to prevent spam and improve data quality

### ✅ Detailed Validation Results (v3.1.0)

Returns structured objects instead of just boolean.

- Includes format check, MX status, disposable info
- Improves debuggability and analytics

### ✅ Error Codes and Typed Errors (v3.2.0)

Added `ErrorCode` enum and `EmailValidationError` class.

- Enables programmatic error handling
- Improves DX for API consumers

---

## 🚀 Next Release – v3.3.0

### 📁 Examples Directory

Add real-world usage examples:

- `basic-validation.js`
- `typescript-usage.ts`
- `bulk-validation.js`
- `error-handling.js`
- `commonjs-usage.cjs`

### 🧠 AI Debug Mode (New)

Add `debug: true` option for enhanced debugging and observability.

- Structured logs with DNS timing + memory usage
- Designed for AI-assisted developer workflows
- JSON logs + MCP-compatible structure (future-ready)

### 🛡️ Enhanced Disposable Detection

Upgrade domain coverage and logic:

- Expand database from 600+ → 3,000+ domains
- Add wildcard and pattern matching
- Enable auto-updating disposable list

---

## 🔜 Near-Term (v3.4.x)

### 🧠 Domain Typo Suggestions

- Detect and fix common typos (e.g., `gmial.com` → `gmail.com`)
- Levenshtein algorithm + confidence threshold
- Suggestions returned in validation results

### ✉️ Email Normalization

- Dot removal for Gmail
- Case normalization
- Plus-addressing support
- Provider-specific rules

### 💾 MX Record Caching (TTL-Based)

- Cache MX records per domain with TTL
- Improves performance for bulk lists
- Supports manual flush and cache stats

---

## 🧪 Medium-Term (3-6 months)

### 🎛️ Validation Profiles

Preconfigured modes for common use cases:

- `strict`: full validation with timeouts
- `lenient`: format only
- `business`: block disposable + role emails
- `fast`: optimized for high throughput

### 🔌 SMTP Connection Testing

- Validate whether mail server is accepting connections
- Does not send emails
- Optional setting due to latency cost

### 👤 Role-Based Email Detection

- Detect generic addresses like `admin@`, `noreply@`, `support@`
- Pattern list customizable
- Included in detailed validation output

### 🚦 Built-in Rate Limiting

- DNS query throttling to avoid network abuse
- Token bucket system
- Per-domain caps + global fallback

---

## 🔮 Long-Term Vision

### 🧠 Email Provider Detection

- Identify major providers (Gmail, Outlook, etc.)
- Enable provider-specific rules
- Analytics and dashboards planned for hosted API users

### 🧩 Bulk Validation Optimization

- Domain-based grouping
- Streaming validation support
- Parallel resolution with TTL cache
- Real-time progress callbacks

### ⛔ Domain Allowlist/Blocklist

- Developer-defined filters
- Wildcard pattern support
- Import/export configuration

### ⚙️ Advanced TypeScript Support

- Branded types for valid emails
- Utility types for inferred usage
- Internal helper type exports

---

## 🔄 Versioning Philosophy

- We follow SemVer (semantic versioning)
- All new features are **opt-in** to avoid breaking changes
- Boolean validation (`true/false`) will remain supported indefinitely
- Detailed structured output will become default **only if community strongly prefers**

---

## 🧠 Contributing

We welcome feedback, requests, and contributions!

- 📣 Open an issue for features or bugs
- 🔧 Send PRs for new validation logic or docs
- 💬 Share your use cases — we prioritize based on real-world need
