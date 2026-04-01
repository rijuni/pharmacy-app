"""
Pytest configuration for pharmacy app tests
"""
import os
import django
from django.conf import settings

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')

# Setup Django
django.setup()

import pytest
from factory.django import DjangoModelFactory
from users.models import User
from products.models import Category, Product
from decimal import Decimal


# ============= FIXTURES =============
@pytest.fixture
def test_user(db):
    """Create a test user"""
    return User.objects.create_user(
        email="testuser@example.com",
        phone_number="9999999999",
        password="testpass123"
    )


@pytest.fixture
def admin_user(db):
    """Create an admin user"""
    return User.objects.create_user(
        email="admin@example.com",
        phone_number="8888888888",
        password="adminpass123",
        is_staff=True,
        is_superuser=True
    )


@pytest.fixture
def test_category(db):
    """Create a test category"""
    return Category.objects.create(
        name="Test Category",
        description="Category for testing"
    )


@pytest.fixture
def test_product(db, test_category):
    """Create a test product"""
    return Product.objects.create(
        name="Test Medicine",
        category=test_category,
        price=Decimal("100.00"),
        stock=50,
        requires_prescription=False,
        manufacturer="Test Manufacturer",
        strength="500mg",
        form="Tablet",
        salt_composition="Test Salt"
    )


@pytest.fixture
def test_product_rx(db, test_category):
    """Create a test prescription-required product"""
    return Product.objects.create(
        name="Test Antibiotic",
        category=test_category,
        price=Decimal("250.00"),
        stock=30,
        requires_prescription=True,
        manufacturer="Antibiotic Inc",
        strength="250mg",
        form="Capsule",
        salt_composition="Amoxicillin"
    )


@pytest.fixture(scope='session')
def django_db_modify_db_settings():
    """Modify DB settings for test database"""
    # This runs once per session
    pass


# ============= MARKERS =============
def pytest_configure(config):
    """Configure pytest markers"""
    config.addinivalue_line(
        "markers", "django_db: mark test as requiring database access"
    )
    config.addinivalue_line(
        "markers", "slow: mark test as slow"
    )
    config.addinivalue_line(
        "markers", "integration: mark test as integration test"
    )


# ============= SETTINGS =============
# Mock email backend for testing
if 'test' in os.sys.argv or 'pytest' in os.sys.argv:
    settings.EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'
    settings.CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'unique-snowflake',
        }
    }
