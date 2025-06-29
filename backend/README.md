## Development Helper Commands

All commands below automatically use the backend's Python virtual environment (venv). You do NOT need to activate it manually.

### Start the development server
```
python run.py dev
```

### Run all tests
```
python run.py test
```

### Alembic Database Migrations

#### Autogenerate a new migration (after changing models)
```
python run.py migrate
```

#### Apply all migrations (upgrade to latest schema)
```
python run.py upgrade
```

#### Revert the last migration
```
python run.py downgrade
```

---

**Note:**
- Never delete your database file to update the schema. Use the migration commands above to keep your data and schema in sync.
- If you add new fields to your models, always run `python run.py migrate` and then `python run.py upgrade`. 