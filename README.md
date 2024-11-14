# REST API for an imaginary healthcare system

My assignment is focused around creating a REST API for an imaginary healthcare system. The API will be able to perform CRUD operations on the Patient entities.

## Schema
The following is the schema for the Patient entity:
```
  id: number,
  first_name: string,
  surname: string,
  PPSN: string,
  age: number,
  sex: boolean, (true = female, false = male)
  personal_phone: number,
  emergency_contact_phone: number,
  date_most_recently_admitted: string,
  ailments: string[ ],
  health_conditions: string[ ],
  blood_type: string,
  hospital_visits_count: number

```

And another entity for hospitals:
```
  hospital_id: number,
  hospital_name: string,
  address: string,
  patient_capacity: number
```

## Endpoints

GET /patients

GET /patients/:id

POST /patients

PUT /patients/:id

DELETE /patients/:id

## Usage


