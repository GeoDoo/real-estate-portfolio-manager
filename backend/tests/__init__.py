# Tests package 

import pytest
from app import app, db

@pytest.fixture(autouse=True, scope="module")
def in_memory_db():
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    with app.app_context():
        db.create_all()
        yield
        db.drop_all() 