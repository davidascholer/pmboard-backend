#!/bin/bash
# This script needs to be run in the project root

# Database connection details
DB_NAME="pmboard_io_dev"
DB_USER="postgres"
DB_PASSWORD=""
DB_HOST="localhost"
DB_PORT="5432"

# Export PGPASSWORD for non-interactive login
export PGPASSWORD=$DB_PASSWORD

# Create the database, dropping and recreating it if necessary
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || echo "Database '$DB_NAME' does not exist or drop failed."
echo "Creating database '$DB_NAME'..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Database '$DB_NAME' already exists or creation failed."

echo "Connecting to '$DB_NAME' and creating tables..."
unset PGPASSWORD

echo "Database '$DB_NAME' created successfully."

# npx prisma migrate reset --schema=./src/prisma/schema.prisma

npx prisma migrate dev --name init 
echo "The Prisma schema has been migrated to the dev database."

npx prisma generate 
echo "Prisma client has been generated."