## Two-Factor Authentication (2FA)

This application implements TOTP-based two-factor authentication using an authenticator application.

### Security features

- TOTP authentication with QR code provisioning.
- Encrypted storage of TOTP secrets.
- TOTP replay prevention.
- Hashed recovery codes.
- Single-use recovery codes.
- Recovery code regeneration.
- Password and TOTP verification when disabling 2FA.
- Five-minute pending authentication challenges.
- Session regeneration and invalidation.
- Rate limiting on sensitive authentication endpoints.
- Database transactions and row locking for sensitive operations.

### Authentication flow

1. User submits email and password.
2. If 2FA is disabled, authentication completes.
3. If 2FA is enabled, a temporary challenge is created.
4. User submits a TOTP or recovery code.
5. Successful verification establishes the authenticated session.

### 2FA API endpoints

| Method | Endpoint                                    | Purpose                       |
| ------ | ------------------------------------------- | ----------------------------- |
| POST   | `/api/two-factor/setup`                     | Generate provisioning QR code |
| POST   | `/api/two-factor/confirm`                   | Enable 2FA                    |
| GET    | `/api/two-factor/status`                    | Retrieve 2FA status           |
| POST   | `/api/two-factor/challenge`                 | Complete login challenge      |
| GET    | `/api/two-factor/challenge/status`          | Check pending challenge       |
| POST   | `/api/two-factor/recovery-codes/regenerate` | Regenerate recovery codes     |
| POST   | `/api/two-factor/disable`                   | Disable 2FA                   |

### Testing

Run backend tests:

```bash
docker compose exec backend php artisan test
```

Run frontend checks:

```bash
docker compose exec frontend npm run lint
docker compose exec frontend npm run build
```

Run Laravel formatting checks:

```bash
docker compose exec backend vendor/bin/pint --test
```

### Security notes

- Never commit `.env` files or application secrets.
- Store recovery codes securely; each code can only be used once.
- Use HTTPS in production.
- Configure secure session cookies and trusted frontend domains.
- Keep dependencies updated.
