# ServiOps development seed

This directory contains repeatable development/demo data for ServiOps.

## Prerequisites

1. Run the current Alembic migrations:
   `alembic upgrade head`
2. Ensure the backend `.env` points to the intended development PostgreSQL database.
3. Run from the backend directory.

## Run

```bash
python -m seed.seed_database
```

The script is designed to be idempotent for the records it owns. It does not
delete existing data. For the known demo employee codes (EMP001-EMP008), it
repairs the demo identity and organizational hierarchy on each run so roles,
departments, sub-departments, and managers stay deterministic.

## What it creates

- 4 departments and their existing sub-department structure
- 6 roles with the current permission vocabulary
- 8 development users with department/sub-department/manager relationships
- 6 customers
- 8 plants linked to customers
- 16 machines linked to plants
- 18 spare parts
- inventory balances and receipt movements
- 14 service tickets linked across customer -> plant -> machine
- ticket history
- comments and @mentions
- notifications
- representative ticket spare-part consumption and issue movements

## Important

The seeded users are application database records only. Cognito users are not
created by this script. Authentication therefore still depends on your
existing Cognito setup.

This is development/demo data, not production seed data.


## Link seeded users to Cognito

After running the PostgreSQL seed, run:

```bash
python -m seed.seed_cognito_users
```

The script reads `COGNITO_REGION` and `COGNITO_USER_POOL_ID` from the backend
`.env`, asks for the shared development password without putting it in source
code, creates/fetches Cognito users for EMP001..EMP008, sets their email as
verified, sets the supplied password permanently, and stores each Cognito
`sub` in PostgreSQL.

It is intended for development only. Do not use a shared password or this
automation pattern for production accounts.
