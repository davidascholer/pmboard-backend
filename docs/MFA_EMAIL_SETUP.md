# MFA Email Setup with AWS SES

This document explains how to set up AWS SES (Simple Email Service) for sending MFA tokens via email.

## Prerequisites

1. AWS Account
2. Verified email domain or email address in AWS SES
3. SMTP credentials for AWS SES

## AWS SES Setup

### 1. Verify Your Email Domain/Address

1. Go to the [AWS SES Console](https://console.aws.amazon.com/ses/)
2. Navigate to "Verified identities"
3. Click "Create identity"
4. Choose either:
   - **Domain**: If you own a domain (recommended for production)
   - **Email address**: For testing purposes
5. Follow the verification process

### 2. Create SMTP Credentials

1. In the AWS SES console, go to "SMTP settings"
2. Click "Create SMTP credentials"
3. Enter a username (or use the auto-generated one)
4. Click "Create"
5. **Important**: Download and save the credentials securely

### 3. Configure Environment Variables

Add the following environment variables to your `.env` file:

```env
# AWS SES Configuration for Email
AWS_SES_SMTP_USERNAME=your_aws_ses_smtp_username
AWS_SES_SMTP_PASSWORD=your_aws_ses_smtp_password
FROM_EMAIL=noreply@yourdomain.com  # Must be verified in SES
```

### 4. Update AWS SES Region (if needed)

The default region in the code is `us-east-1`. If your SES is in a different region, update the host in `mfaController.ts`:

```typescript
host: 'email-smtp.YOUR-REGION.amazonaws.com',
```

Common SES endpoints:
- US East (N. Virginia): `email-smtp.us-east-1.amazonaws.com`
- US West (Oregon): `email-smtp.us-west-2.amazonaws.com`
- Europe (Ireland): `email-smtp.eu-west-1.amazonaws.com`

## Testing

### Development/Sandbox Mode

By default, AWS SES operates in sandbox mode, which means:
- You can only send emails to verified email addresses
- You have a daily sending limit of 200 emails
- You can send up to 1 email per second

### Production Mode

To send emails to any recipient:
1. Request production access in the AWS SES console
2. Go to "Sending statistics" → "Request production access"
3. Fill out the form explaining your use case
4. Wait for AWS approval (usually 24-48 hours)

## Email Template

The MFA email includes:
- Professional HTML formatting
- Clear token display
- 5-minute expiration notice
- Security warning
- Plain text fallback

## Troubleshooting

### Common Issues

1. **"Email address not verified"**
   - Ensure the `FROM_EMAIL` is verified in AWS SES
   - Check that the email address exactly matches the verified identity

2. **"Message rejected"**
   - Verify you're not in sandbox mode or the recipient email is verified
   - Check your SES sending statistics for bounces/complaints

3. **"Invalid credentials"**
   - Verify your SMTP username and password
   - Ensure you're using SMTP credentials, not AWS access keys

4. **"Connection timeout"**
   - Check the SES endpoint region
   - Verify firewall/security group settings

### Testing Email Delivery

You can test the MFA email endpoint with:

```bash
curl -X POST http://localhost:3000/api/mfa/emailToken \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Security Considerations

1. **Environment Variables**: Never commit SES credentials to version control
2. **Rate Limiting**: Implement rate limiting to prevent email abuse
3. **Token Expiration**: Tokens expire in 5 minutes for security
4. **HTTPS**: Always use HTTPS in production to protect tokens in transit
5. **Monitoring**: Monitor SES bounce and complaint rates to maintain reputation

## Cost

AWS SES pricing (as of 2024):
- First 62,000 emails per month: $0 (free tier)
- Additional emails: $0.10 per 1,000 emails
- No setup fees or monthly charges

## Alternative Email Providers

If you prefer other email services, you can modify the nodemailer configuration for:
- Gmail SMTP
- SendGrid
- Mailgun
- Postmark

Just update the transporter configuration in `emailMfaToken` function.
