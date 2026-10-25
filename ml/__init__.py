"""Karu Machine Learning & Textile Authentication Package.

Standalone module for authenticating genuine artisan handloom crafts vs.
powerloom/synthetic replicas using deep metric learning and vision-language models.
"""

from ml.authenticator import AuthenticityReport, KaruTextileAuthenticator

__all__ = ["KaruTextileAuthenticator", "AuthenticityReport"]
