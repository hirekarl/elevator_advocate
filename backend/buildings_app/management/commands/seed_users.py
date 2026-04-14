"""
Idempotent user seed: creates the Admin superuser and five demo tenant
accounts if they do not already exist. Safe to run on every deployment —
skips any account that is already present.

Reads all credentials from environment variables. Exits with a clear
error if required variables are missing.

Environment variables:
    SEED_ADMIN_USERNAME   Username for the superuser (default: "admin")
    SEED_ADMIN_EMAIL      Email for the superuser
                          (default: "admin@elevatoradvocate.nyc")
    SEED_ADMIN_PASSWORD   Required. Password for the superuser.
    SEED_USER_PASSWORD    Required. Shared password for all five tenant accounts.
"""

import os

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError

TENANT_USERS: list[tuple[str, str, str]] = [
    ("martha_rivera", "martha@example.com", "Martha"),
    ("carlos_mendez", "carlos@example.com", "Carlos"),
    ("yolanda_chen", "yolanda@example.com", "Yolanda"),
    ("james_okafor", "james@example.com", "James"),
    ("priya_singh", "priya@example.com", "Priya"),
]


_DEFAULT_ADMIN_EMAIL = "admin@elevatoradvocate.nyc"


class Command(BaseCommand):
    help = (
        "Idempotent seed: creates Admin superuser and five demo tenant accounts"
        " if they do not already exist. Safe to run on every deploy."
    )

    def handle(self, *args: object, **options: object) -> None:
        admin_username = os.environ.get("SEED_ADMIN_USERNAME", "admin")
        admin_email = os.environ.get("SEED_ADMIN_EMAIL", _DEFAULT_ADMIN_EMAIL)
        admin_password = os.environ.get("SEED_ADMIN_PASSWORD")
        user_password = os.environ.get("SEED_USER_PASSWORD")

        if not admin_password:
            raise CommandError("SEED_ADMIN_PASSWORD is not set.")
        if not user_password:
            raise CommandError("SEED_USER_PASSWORD is not set.")

        self.stdout.write("Seeding users...")
        self._seed_superuser(admin_username, admin_email, admin_password)
        self._seed_tenant_users(user_password)
        self.stdout.write(self.style.SUCCESS("User seeding complete."))

    def _seed_superuser(self, username: str, email: str, password: str) -> None:
        """Create the Admin superuser if not present, or update the password if it is.

        Password is always synced from the env var so that changing
        SEED_ADMIN_PASSWORD in Render takes effect on the next deploy.

        Args:
            username: Superuser login name.
            email: Superuser email address.
            password: Superuser password.
        """
        user, created = User.objects.get_or_create(
            username=username,
            defaults={"email": email, "is_staff": True, "is_superuser": True},
        )
        user.set_password(password)
        user.save()

        if created:
            self.stdout.write(self.style.SUCCESS(f"  Created superuser: {username}"))
        else:
            self.stdout.write(
                self.style.SUCCESS(f"  Updated password for superuser: {username}")
            )

    def _seed_tenant_users(self, password: str) -> None:
        """Create the five demo tenant accounts if they do not already exist.

        UserProfile is auto-created by the post_save signal — no manual
        creation needed here.

        Args:
            password: Shared password for all tenant accounts.
        """
        for username, email, first_name in TENANT_USERS:
            if User.objects.filter(username=username).exists():
                self.stdout.write(f"  User '{username}' already exists — skipping.")
                continue

            User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                is_active=True,
            )
            self.stdout.write(self.style.SUCCESS(f"  Created tenant user: {username}"))
