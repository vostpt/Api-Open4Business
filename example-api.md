# API Examples

## Authorization

This API uses Bearer Authentication.
Authentication token can be sent as header or as query param.

Header
```
Authorization: Bearer token
```

Query Param
```
?token=XXX
```


## Register Account

**POST** https://open4biz.vost.pt/api/insights/v1/business

Payload

```json
{
  "company": "Company Name",
  "companyType": "big | small",
  "name": "Name of the owner",
  "email": "email of the owner",
  "phone": "phone of the owner"
}
```

Response

```json
{
    "resultCode": 200,
    "resultMessage": "OK",
    "resultTimestamp": 1588067990,
    "data": {
      "company": "Company Name",
      "companyType": "big | small",
      "name": "Name of the owner",
      "email": "email of the owner",
      "phone": "phone of the owner",
      "businessId": "ffb2d210-8936-11ea-bb97-bf40dc39f607",
      "__v": 0
    }
}
```

## Sign In

**POST** https://open4biz.vost.pt/api/auth/v1/signin

Payload

```json
{
  "authId": "your email",
  "password": "XXXXXXXX",
  "sessionType": "api",
  "context": ""
}
```

Response

```json
{
    "resultCode": 200,
    "resultMessage": "OK",
    "resultTimestamp": 1588069257,
    "data": {
        "token": "Bearer Token to include in following requests"
    }
}
```

## Add One Location

**POST** https://open4biz.vost.pt/api/businesses/v1/locations

Payload

```json
{
  "businessId": "XXX",
  "company": "XXX",
  "store": "XXX",
  "address": "XXX",
  "parish": "XXX",
  "council": "XXX",
  "district": "XXX",
  "zipCode": "1000-100",
  "latitude": 0,
  "longitude": 0,
  "phone": "XXX",
  "sector": "XXX",

  "schedule1": "09:00-13:00",
  "schedule1Dow": "Segunda,Terca,Quarta,Quinta,Sexta,Sabado,Domingo",
  "schedule1Type": "Público em Geral",
  "schedule1Period": "manhã",

  "schedule2": "",
  "schedule2Dow": "",
  "schedule2Type": "",
  "schedule2Period": "",

  "schedule3": "",
  "schedule3Dow": "",
  "schedule3Type": "",
  "schedule3Period": "",

  "byAppointment": "Sim",
  "contactForSchedule": "123456789",
  "typeOfService": "entregas",
  "obs": "Notas adicionais",
  "isOpen": true
}
```

Response

```json
{
  "resultCode": 200,
  "resultMessage": "OK",
  "resultTimestamp": 1588070129,
  "data": {}
}
```

## Import Locations CSV

**POST** https://open4biz.vost.pt/api/businesses/v1/file

Payload
```
Content-Disposition: form-data; name="file"; filename="O4B_Template.csv"
Content-Type: text/csv
```

Response

```json
{
  "resultCode":200,
  "resultMessage":"OK",
  "resultTimestamp":1588070306,
  "data":{
    "id":"uploads/tmp/abb465b1-3692-43a7-a978-38e37a518b18.csv"
  }
}
```

## Process Locations CSV

**POST** https://open4biz.vost.pt/api/businesses/v1/locations

Payload
```json
{
  "dataFile": "uploads/tmp/abb465b1-3692-43a7-a978-38e37a518b18.csv",
  "email": "baldasman@gmail.com",
  "name": "Pedro Santos",
  "phone": "936345897"
}
```

Response

```json
{
  "resultCode":200,
  "resultMessage":"OK",
  "resultTimestamp":1588070461,
  "data": {
    "batchId":"269393b2-de3f-4d54-8170-582eb55da93d",
    "totalRows":1,
    "addCount":1,
    "updateCount":0,
    "errorCount":0,
    "errors":[]
  }
}
```
