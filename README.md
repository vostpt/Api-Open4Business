# Open4Business API
Open4Business is a crowdsourced information system for business started during during the COVID19 pandemic in Portugal.

Open4Business API is the REST interface with the platform.

# The Project
Build a crowdsourced website (followed by an app) where users can check if a certain business is open What are the opening hours and what are the diverse timetables for specific groups What kind of service is provided

# Priority
This is a critical priority project. All resources should be focused on this, apart from the team that is developing the app for covid19estamoson.gov.pt


## Installation

### Environment variables

| Name        | Required | Default           | Possibilities                                | Description |
| ----------- | :------: | :---------------: | -------------------------------------------- | ----------- |
| APP_URL     |   Yes    |                   | http://localhost:5000                        |             |
| APP_PORT    |          | 80                | 0 - 40000                                    |             |
| LOG_LEVEL   |          | ['error', 'warn'] | ['log', 'error', 'warn', 'debug', 'verbose'] |             |

Create .env file in the root.
``` 
PORT=8000
TOKEN_TTL=172800
MONGO_DB_HOST=localhost
MONGO_DB_PORT=27017
MONGO_DB_USER=dev
MONGO_DB_PASS=YOUR_PASS_HERE
MONGO_DB_DATABASE=open4business
MONGO_DB_INITIAL_CONNECTION_ATTEMPTS=10
MONGO_DB_INITIAL_CONNECTION_INTERVAL=1000
DEFAULT_TIMEOUT=90
UPLOADS_PATH=uploads
LOG_LEVEL=Open4Business:LOG|WARNING|ERROR|DEBUG
SMTP_HOST=host
SMTP_EMAIL=email
SMTP_PASSWORD=password
ADMIN_EMAIL=admin_email
PORTAL=http://localhost:4200
```
Allowed log levels: LOG|WARNING|ERROR|DEBUG
values in the array can be any combination of 'log', 'error', 'warn', 'debug', and 'verbose'.

### Run the following commands:

``` 
$ npm install
```

## Running the app
### Development mode

``` 
npm run start:dev
```

### Production mode
``` 
npm run build
npm start:prod
```

### Development Dockers
To run additional layers (like DB's):
``` 
docker-compose --file ./.docker/docker-compose.yml up

```

### Build
```
docker build --target publishStage --tag vostpt/open4business-api:latest .
```

### Publish
```
echo "PASS" | docker login --username USER --password-stdin docker.io
docker push vostpt/open4business-api:latest
```

Continente
NW: 42.165412, -8.951873
SE: 36.893529, -6.298540

Açores
NW: 39.737816, -31.325672
SE: 36.896195, -24.901089

Madeira
NW: 33.179556, -17.383185
SE: 32.356150, -16.245027