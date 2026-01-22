# Security Hardening Documentation

This document describes the security measures implemented in the JD-Aware Resume Engineering SaaS application.

## ⚠️ IMPORTANT: Compromised Secrets

**The following secrets were found exposed in the repository and should be rotated immediately:**

1. **Nebius API Key** - Rotate at https://studio.nebius.ai/
2. **Clerk Secret Key** - Rotate at https://dashboard.clerk.com/
3. **Cloudinary API Key/Secret** - Rotate at https://cloudinary.com/console
4. **Database Password** - Change the PostgreSQL password

### How to Rotate Secrets

1. Generate new credentials from each service
2. Update your `.env` file with new values
3. Update GitHub Secrets in repository settings
4. Redeploy the application
5. Verify all services are working

---

## Security Measures Implemented

### 1. Rate Limiting (OWASP A05:2021 - Security Misconfiguration)

All endpoints are protected by rate limiting using `@nestjs/throttler`:

| Endpoint Type | Limit | Window | Rationale |
|---------------|-------|--------|-----------|
| Default (all) | 100 req | 60 sec | Prevent general abuse |
| AI Operations | 5-10 req | 60 sec | Expensive operations, cost control |
| File Upload | 5 req | 60 sec | Storage abuse prevention |
| API Key Management | 5 req | 60 sec | Prevent brute force |

**Features:**
- IP-based limiting for anonymous requests
- User+IP combined limiting for authenticated requests
- Graceful 429 responses with `Retry-After` header
- Configurable via environment variables

**Configuration:**
```env
THROTTLE_TTL=60000          # Default window (ms)
THROTTLE_LIMIT=100          # Default limit
THROTTLE_STRICT_TTL=60000   # Strict window
THROTTLE_STRICT_LIMIT=10    # Strict limit
THROTTLE_UPLOAD_TTL=60000   # Upload window
THROTTLE_UPLOAD_LIMIT=5     # Upload limit
```

### 2. Input Validation & Sanitization (OWASP A03:2021 - Injection)

All user inputs are validated using `class-validator` with strict settings:

**Validation Rules:**
- `whitelist: true` - Strip unexpected properties
- `forbidNonWhitelisted: true` - Reject requests with unknown fields
- `transform: true` - Convert types automatically

**DTO Validations:**
- UUID format validation for all IDs
- Length limits on all string fields
- Enum validation for restricted values
- Array size limits to prevent DoS
- Regex patterns for names (alphanumeric + safe chars only)
- URL validation (HTTPS required for endpoints)

**Sanitization Utilities:**
Located in `src/common/utils/sanitize.util.ts`:
- `sanitizeHtml()` - XSS prevention
- `stripHtmlTags()` - Remove HTML
- `sanitizeFilename()` - Path traversal prevention
- `sanitizeUrl()` - Open redirect prevention
- `stripNullBytes()` - Null byte injection prevention

### 3. Secure API Key Handling (OWASP A02:2021 - Cryptographic Failures)

**Encryption:**
- User API keys are encrypted with AES-256-GCM before storage
- Unique IV for each encryption
- Authentication tag prevents tampering
- Keys decrypted only when needed

**Configuration:**
```env
# Generate with: openssl rand -hex 32
ENCRYPTION_KEY=<64-character-hex-string>
```

**Never Exposed:**
- Raw API keys are NEVER returned in API responses
- Keys are masked in logs (`sk_t****quGBo`)
- ListUserApiKeys only returns metadata

### 4. HTTP Security Headers (Helmet)

Implemented via `helmet` middleware:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (HSTS)
- `Content-Security-Policy`
- `Referrer-Policy: strict-origin-when-cross-origin`

### 5. CORS Configuration

Strict CORS with explicit origin whitelist:
- Only allowed origins can make requests
- Credentials enabled for authenticated requests
- Blocked origins are logged for monitoring

### 6. Authentication (Clerk)

- JWT validation on all protected endpoints
- User ID extracted from verified tokens
- Sessions managed by Clerk (refresh, revocation)
- No password storage in our database

---

## File Structure

```
backend/src/common/
├── filters/
│   └── throttler-exception.filter.ts  # Graceful 429 responses
├── guards/
│   └── throttler.guard.ts             # IP + user rate limiting
├── security/
│   └── security.module.ts             # ThrottlerModule config
├── utils/
│   ├── encryption.util.ts             # AES-256-GCM encryption
│   └── sanitize.util.ts               # Input sanitization
└── validators/
    └── custom.validators.ts           # Custom validation decorators
```

---

## Environment Variables Security

**Required for Production:**
```env
ENCRYPTION_KEY=<generated-hex-key>
NODE_ENV=production
```

**Generate Encryption Key:**
```bash
openssl rand -hex 32
```

---

## Monitoring & Alerts

The following events are logged for security monitoring:

1. Rate limit violations: `[RateLimit] Exceeded: user=X, ip=X, path=X`
2. CORS violations: `[CORS] Blocked request from origin: X`
3. API key operations: `[ApiKeys] Storing/Deleting key for user X`
4. Decryption failures: `[ApiKeys] Failed to decrypt API key X`

---

## Security Checklist for Deployment

- [ ] All secrets rotated (Clerk, Nebius, Cloudinary, DB)
- [ ] ENCRYPTION_KEY is randomly generated (64 hex chars)
- [ ] .env file is NOT in version control
- [ ] GitHub Secrets are configured
- [ ] HTTPS is enabled (SSL certificate)
- [ ] Database has strong password
- [ ] NODE_ENV=production is set
- [ ] Rate limits are appropriate for expected traffic

---

## References

- [OWASP Top 10](https://owasp.org/Top10/)
- [NestJS Security](https://docs.nestjs.com/security/helmet)
- [class-validator](https://github.com/typestack/class-validator)
- [@nestjs/throttler](https://docs.nestjs.com/security/rate-limiting)
