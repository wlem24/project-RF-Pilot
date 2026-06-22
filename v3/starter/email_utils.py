"""
Email utility for RFPilot.

Configure these environment variables to enable real email delivery:
  SMTP_HOST  — e.g. smtp.gmail.com  / smtp.resend.com
  SMTP_PORT  — typically 587 (STARTTLS) or 465 (SSL)
  SMTP_USER  — your SMTP login / API key username
  SMTP_PASS  — your SMTP password / API key
  SMTP_FROM  — sender address, e.g. noreply@rfpilot.com
  FRONTEND_URL — base URL of the frontend, e.g. http://localhost:3001

If SMTP_HOST is empty the email is NOT sent but the invite link is
included in the API response so it can be shared manually during development.
"""
import logging
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_HOST    = os.getenv("SMTP_HOST", "")
SMTP_PORT    = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER    = os.getenv("SMTP_USER", "")
SMTP_PASS    = os.getenv("SMTP_PASS", "")
SMTP_FROM    = os.getenv("SMTP_FROM", "noreply@rfpilot.com")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3001")

logger = logging.getLogger(__name__)

# Email delivery status constants
EMAIL_SENT        = "sent"
EMAIL_FAILED      = "failed"
EMAIL_NO_SMTP     = "no_smtp_configured"


def build_invite_url(token: str) -> str:
    return f"{FRONTEND_URL}/accept-invite?token={token}"


def send_invitation_email(to_email: str, invited_by_name: str, role: str, token: str) -> dict:
    """
    Send an invitation email.

    Returns a dict with keys:
      status    — "sent" | "failed" | "no_smtp_configured"
      invite_url — always present so admin can copy it
      message   — human-readable note when email was not sent
    """
    invite_url = build_invite_url(token)

    if not SMTP_HOST or not SMTP_USER:
        logger.warning(
            "SMTP not configured. Invite URL for %s: %s", to_email, invite_url
        )
        return {
            "status"     : EMAIL_NO_SMTP,
            "invite_url" : invite_url,
            "message"    : "SMTP is not configured — share this invite link manually.",
        }

    html_body = f"""
    <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:40px 20px">
      <h1 style="font-size:24px;font-weight:700;color:#111827;margin-bottom:8px">
        You've been invited to RFPilot
      </h1>
      <p style="color:#6b7280;margin-bottom:24px">
        <strong>{invited_by_name}</strong> has invited you to join RFPilot as
        <strong style="color:#6366f1">{role.title()}</strong>.
      </p>
      <a href="{invite_url}"
         style="display:inline-block;padding:12px 28px;background:#6366f1;color:#fff;
                border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
        Accept invitation
      </a>
      <p style="color:#9ca3af;font-size:13px;margin-top:24px">
        This link expires in 7 days. If you didn't expect this invitation, you can ignore it.
      </p>
      <hr style="border:none;border-top:1px solid #f3f4f6;margin:32px 0"/>
      <p style="color:#d1d5db;font-size:12px">RFPilot · Powered by AI</p>
    </div>
    """

    msg              = MIMEMultipart("alternative")
    msg["Subject"]   = f"You've been invited to RFPilot as {role.title()}"
    msg["From"]      = SMTP_FROM
    msg["To"]        = to_email
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_FROM, to_email, msg.as_string())
        logger.info("Invite email sent to %s", to_email)
        return {
            "status"     : EMAIL_SENT,
            "invite_url" : invite_url,
        }

    except Exception as exc:
        logger.error("Email send failed for %s: %s", to_email, exc)
        return {
            "status"     : EMAIL_FAILED,
            "invite_url" : invite_url,
            "message"    : f"Email delivery failed — share this invite link manually. Error: {exc}",
        }
