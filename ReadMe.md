# Flow
- sh seed.sh
- npx prisma init --datasource-provider postgresql --output ../generated/prisma
- npx prisma migrate dev --name init

# Helpful commands

## npx prisma init --datasource-provider postgresql --output ../generated/prisma
- Start the psql prisma project

## npx prisma db pull

- Pulls a currently configured database models into the schema.prisma file.

## npx prisma migrate dev

- Pushes models from schema.prisma file to the configured database
- For first push e.g.: npx prisma migrate dev --name init

## npx prisma studio

- Interactive UI to interact with the database

## npx prisma generate
- generates types, if not done automatically 


# Concepts

## One to many relationship

- Simply create a column that holds a list of ManyModel.
  - e.g. model OneModel { models manyModel[] }
- Create a reference column in ManyModel for the id and connect it to the id of OneModel
  - e.g. model ManyModel { oneModelID String manyModel ManyModel @relation([fields: [oneModelID], references: [id] ]) }

## One to one relationship

- Reference the other model
  - e.g. model ModelA { modelB ModelB }
- Create a reference column in ManyModel for the id and connect it to the id of OneModel
- Exactly like in One to many relationships, except make the reference id unique
  - e.g. model ModelB { modelAId String @unique modelA ModelA @relation([ fields: [modelAId], references: [id] ]) }

## Many to many relationship

- Simply create a column for each that hold a list of the other
  - e.g. model ModelA { modelB[] }; model ModelB { modelA[] }

# Partial list of attributes

- @unique
  - Makes sure the item column is unique
- @relation(...)
  - Specifies the realtionships on Joined models
- updatedAt DateTime updatedAt
  - Creates a timestamp upon creation
- createdAt DateTime default(now())
  - Creates a timestamp upon update

## block level

- @@unique([colOne, colTwo])
  - The model now cannot have an item where both colOne AND colTwo are identical
    - If colOne is the same but colTwo are different, that is ok.
- @@index([ email ])
  - Allows querying by email
- @@id([ colOne, colTwo ])
  - Instead of uuid or incremented IDs, it combines colOne and colTwo to make the id

# CRUD

- All are appended with 'prisma.table.' e.g. prisma.user.findUnqiue { ... }
- Create
  - create { data: ... }
    - creates one new row
  - createMany { data: [...] }
    - creates multiple new rows
  - createManyAndReturn { data: [...] }
    - to return the newly created objects
- Read
  - findUnique { where: { id: '...id...' }}
    - Finds one and only one
  - findMany { where: { id: '...id...' }}
    - Finds one and only one
  - findFirst { where: { posts: { some: { likes : { gt: 100 }}}}}
    - Finds the first matching item in the table
- Update
  - update { data: ... }
    - updates one row
  - updateMany { data: [...] }
    - updates multiple rows
  - updateManyAndReturn { data: [...] }
    - to return the updated objects
- Delete
    - delete { where { ... }}
        - deletes one where the 'where' only returns one
    - deleteMany { where { ... }}
        - Deletes multiple rows
    - deleteMany()
        - Deletes ALL rows in column
- Update or Create
  - upsert { { where: email: "test@test.com", update: name: "test", create: { email: "test@test.com", name: "test" }}}
    - Updates the name field or create the new object if the email address does not exist.
- Find Or Create
  - upsert { { where: email: "test@test.com", update: , create: { email: "test@test.com", name: "test" }}}
    - Same as Update or Create but with an empty update parameter

## selectors

- where: {...}
  - beggining of some sort of query in the db
- ## some: {...}
- where: { columnName: { gt: gtNum }}
  - return true when the item number is greater than gtNum
