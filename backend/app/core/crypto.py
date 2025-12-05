"""
Token encryption/decryption using Fernet symmetric encryption.
"""

from functools import lru_cache

from cryptography.fernet import Fernet

from app.core.config import settings


class CryptoError(Exception):
    """Base exception for crypto operations."""

    pass


@lru_cache(maxsize=1)
def _get_fernet() -> Fernet:
    """Get cached Fernet instance."""
    if not settings.ENCRYPTION_KEY:
        raise CryptoError(
            "ENCRYPTION_KEY is not set. Generate one with: "
            "python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'"
        )
    try:
        return Fernet(settings.ENCRYPTION_KEY.encode())
    except Exception as e:
        raise CryptoError(f"Invalid ENCRYPTION_KEY: {e}") from e


def encrypt_token(token: str) -> str:
    """
    Encrypt a plain text token.

    Args:
        token: Plain text API token

    Returns:
        Base64 encoded encrypted token
    """
    fernet = _get_fernet()
    return fernet.encrypt(token.encode()).decode()


def decrypt_token(encrypted_token: str) -> str:
    """
    Decrypt an encrypted token.

    Args:
        encrypted_token: Base64 encoded encrypted token

    Returns:
        Plain text API token
    """
    fernet = _get_fernet()
    try:
        return fernet.decrypt(encrypted_token.encode()).decode()
    except Exception as e:
        raise CryptoError(f"Failed to decrypt token: {e}") from e


def generate_encryption_key() -> str:
    """Generate a new Fernet encryption key."""
    return Fernet.generate_key().decode()
