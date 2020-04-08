#!/usr/bin/env bash
echo "\nCreating mongo users...\n"

mongo developmentDB \
  --host localhost \
  --authenticationDatabase admin \
  -u $MONGO_INITDB_ROOT_USERNAME \
  -p $MONGO_INITDB_ROOT_PASSWORD \
  --eval "db.createUser({
    user: '$MONGO_DEFAULT_DB_USER',
    pwd: '$MONGO_DEFAULT_DB_PASSWORD',
    roles: [{role: 'readWrite', db: '$MONGO_DEFAULT_DB'}]
  });"

echo "\nMongo users created.\n"
