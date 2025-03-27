# tests/conftest.py
import pytest
from src.main import mongo

@pytest.fixture(scope='session')
def app():
    app = create_app()
    app.config.update({'TESTING': True})
    yield app

@pytest.fixture(scope='session')
def client(app):
    return app.test_client()

@pytest.fixture(scope='session')
def runner(app):
    return app.test_cli_runner()