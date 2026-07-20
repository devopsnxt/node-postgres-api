# node-postgres-api

A simple Node.js REST API using Express and `pg` to add and retrieve users from PostgreSQL.

## Setup

1. Open a terminal in `node-postgres-api`.
2. Install dependencies:

```bash
npm install
```

3. Copy `.env.example` to `.env` and update connection values if needed:

```bash
copy .env.example .env
```

4. Create the `users` table in PostgreSQL:

```bash
psql -h localhost -U postgres -d postgres -f sql/init.sql
```

5. Start the API:

```bash
npm start
```

The server listens on `http://localhost:3000` by default.

## API Endpoints

### POST /users

Create a new user.

- URL: `http://localhost:3000/users`
- Method: `POST`
- Headers: `Content-Type: application/json`
- Body example:

```json
{
  "name": "Jane Doe",
  "email": "jane.doe@example.com"
}
```

Response:

- `201 Created` with the created user object
- `400 Bad Request` when `name` or `email` is missing
- `409 Conflict` when the email already exists

### GET /users

Retrieve all users.

- URL: `http://localhost:3000/users`
- Method: `GET`

Response:

- `200 OK` with an array of user objects

## Postman Testing Instructions

1. Open Postman.
2. Create a new request for `POST http://localhost:3000/users`.
3. Set the request body type to `raw` and `JSON`.
4. Use a body such as:

```json
{
  "name": "Alice Example",
  "email": "alice@example.com"
}
```

5. Send the request. Confirm the response contains the created user and HTTP status `201`.
6. Create another request for `GET http://localhost:3000/users`.
7. Send the request and confirm the response includes the user created earlier.

## Docker and Local Testing

You can run the API and PostgreSQL together using Docker Compose.

Start the services:

```bash
docker compose up --build
```

The API will be available at `http://localhost:3000` and the database will be available at `localhost:5432`.

The `sql/init.sql` file is mounted into the DB container at `/docker-entrypoint-initdb.d`, so PostgreSQL will execute it automatically the first time the database is initialized.

If you need to run the script manually, use:

```bash
docker compose exec db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/init.sql
```

If you make schema changes and want to reinitialize the database, stop Docker and remove the volume:

```bash
docker compose down -v
```

Stop and remove services:

```bash
docker compose down
```

## Notes

- The API reads PostgreSQL connection settings from environment variables.
- Use `.env` to set `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, and `PGDATABASE` if you run the API outside Docker.
