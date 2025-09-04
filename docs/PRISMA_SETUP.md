# Prisma

## Setup local Postgres DB

- Enter into psql program
  `psql`
- Create database
  `CREATE DATABASE new_database;``
- Verify created databsase
  ` \l`

### Optional: populate the initial database

- Connect to database
  `\c new_database;`
- Create table with rows
  `CREATE TABLE my_table (id SERIAL PRIMARY KEY, name VARCHAR(50), email VARCHAR(100));`
- Add column
  `ALTER TABLE my_table ADD COLUMN age INT;`
- Create row
  `INSERT INTO my_table (name,email) VALUES ('John','j@gmail.com');`
  `INSERT INTO my_table (name) VALUES ('George');`
- Edit row (this will edit all rows where name = George)
  `UPDATE my_table SET email='g@gmail.com' WHERE name='George';`
- View tables
  `\dt`
- Select all from table
  `SELECT * FROM my_table;`
- View columns and additional info of table
  `\dt my_table`
- Drop table if needed
  `DROP TABLE my_table;`
- Drop db if needed (after switching to another database with `\c another_db`)
  `DROP DATABASE my_database;`
  Note: - When querying with case sensitivity, use quote - e.g. SELECT \* FROM "MyTable";

## Install prisma into a Typescript Node Project

Note: @prisma/client is the actual client used while prisma is the prisma cli and used as a dev dep

```
npm install prisma --save-dev
npm i @prisma/client
```

- See a list of commands you can do with the prisma cli
  `npx prisma`
- Set up a Prisma Schema: - Creates a new directory called prisma that contains a file called schema.prisma, which contains the Prisma Schema with your database connection variable and schema models. - Sets the datasource to PostgreSQL and the output to a custom location, respectively. - Creates the .env file in the root directory of the project, which is used for defining environment variables (such as your database connection)
  `npx prisma init --datasource-provider postgresql --output ../generated/prisma`
- Set up your tables by editing the Prisma/schema.prisma file to your desired structure e.g.:

```
model User {
  id             String          @id @default(uuid())
  name           String?         @db.VarChar(255)
  email          String          @unique @db.VarChar(255)
  password       String          @db.VarChar(255)
  createdAt      DateTime        @default(now()) @db.Timestamp(3)
  updatedAt      DateTime        @updatedAt @db.Timestamp(3)
  role			 Role            @default(MEMBER)
}
```

Set the datasource in the schema.prisma file to the url string of your dev or prod server e.g.:

```
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Where, in the .env file,

```
# DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA"
# For local
DATABASE_URL="postgresql://postgres:@localhost:5432/new_database?schema=public"
# For Heroku
DATABASE_URL="postgresql://opnmyfngbknppm:XXX@ec2-46-137-91-216.eu-west-1.compute.amazonaws.com:5432/d50rgmkqi2ipus?schema=hello-prisma"

```

## Create the prisma model from the database (instrospection)

- Note: Prisma naming convention is for all tables to be lowercased
- Note: You can do this even with an empty db.
- Note: This is optional, but recommended as to not having to create the blank schema
- Reads the database and pulls the schema into the prisma schema
  `npx prisma db pull`

## Make changes to the schema

- Edit the schema.prisma structure and migrate the changes
  `npx prisma migrate dev --name added_job_title`
- Update the prisma client with the changed migrations
  `npx prisma generate`

## Create a Prisma client singleton

```
// Singleton Prisma instance
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export default prisma;
```

- Reference this singleton instead of creating new connections to the connection pool
- Calling this will create a connection to the database automatically if one does not exists
- Prisma calls $disconnect() automatically when the process ends

## Notes

- Naming conventions
- Prisma schemas should/must adhere to the following naming convetions
  - All model names and fields should be: [A-Za-z][A-Za-z0-9_]\* and must start with a letter
  - All model names should be PascalCase
  - Model names should use the singular form (for example, User instead of user, users or Users)
  - All model fields should be camelCase
  - All models should not be one of the Prisma [reserved words](https://github.com/prisma/prisma-engines/blob/main/psl/parser-database/src/names/reserved_model_names.rs#L44)
- Create types in schema by useing enums e.g.:

```
enum Role {
  OWNER
  ADMIN
  MEMBER
  TESTER
  GUEST
}
```

- Ref page to view migrations before migrating as well as outputting a shell script [here](https://www.prisma.io/docs/getting-started/setup-prisma/add-to-existing-project/relational-databases/baseline-your-database-typescript-postgresql)

## CRUD

### Create

- Create

```
const user = await prisma.user.create({
  data: {
    email: 'elsa@prisma.io',
    name: 'Elsa Prisma',
  },
})
```

- Create many (does not return the created objects)

```const createMany = await prisma.user.createMany({
  data: [
    { name: 'Bob', email: 'bob@prisma.io' },
    { name: 'Bobo', email: 'bob@prisma.io' }, // Duplicate unique key!
    { name: 'Yewande', email: 'yewande@prisma.io' },
    { name: 'Angelique', email: 'angelique@prisma.io' },
  ],
  skipDuplicates: true, // Skip 'Bobo', Not supported with MongoDB, SQLServer, or SQLite
})
```

- Create many and return

```
const users = await prisma.user.createManyAndReturn({
  data: [
    { name: 'Alice', email: 'alice@prisma.io' },
    { name: 'Bob', email: 'bob@prisma.io' },
  ],
})
```

### Read

- Find one

```
const user = await prisma.user.findUnique({
  where: {
    email: 'elsa@prisma.io',
  },
})

// By ID
const user = await prisma.user.findUnique({
  where: {
    id: 99,
  },
})
```

- Find many

```
const users = await prisma.user.findMany({
  where: {
    email: {
      endsWith: 'prisma.io',
    },
  },
})
```

or

```
const users = await prisma.user.findMany({
  where: {
    OR: [
      {
        name: {
          startsWith: 'E',
        },
      },
      {
        AND: {
          profileViews: {
            gt: 0,
          },
          role: {
            equals: 'ADMIN',
          },
        },
      },
    ],
  },
})
```

or

```
const users = await prisma.user.findMany({
  where: {
    email: {
      endsWith: 'prisma.io',
    },
    posts: {
      some: {
        published: false,
      },
    },
  },
})
```

- Find all

  ```
  const allUsers = await prisma.user.findMany()
  ```

- Return partial fields only

```
const user = await prisma.user.findUnique({
  where: {
    email: 'emma@prisma.io',
  },
  select: {
    email: true,
    posts: {
      select: {
        likes: true,
      },
    },
  },
})
```

- Include related records

```
const users = await prisma.user.findMany({
  where: {
    role: 'ADMIN',
  },
  include: {
    posts: true,
  },
})
```

### Update

- Update one

```
const updateUser = await prisma.user.update({
  where: {
    email: 'viola@prisma.io',
  },
  data: {
    name: 'Viola the Magnificent',
  },
})
```

- Update many

```
const updateUsers = await prisma.user.updateMany({
  where: {
    email: {
      contains: 'prisma.io',
    },
  },
  data: {
    role: 'ADMIN',
  },
})
```

- Update an integer on many fields

```
const updatePosts = await prisma.post.updateMany({
  data: {
    views: {
      increment: 1,
    },
    likes: {
      increment: 1,
    },
  },
})


```

- Update many and return objects

```
const users = await prisma.user.updateManyAndReturn({
  where: {
    email: {
      contains: 'prisma.io',
    }
  },
  data: {
    role: 'ADMIN'
  }
})
```

### Create OR Update

- Create one OR update one

```
const upsertUser = await prisma.user.upsert({
  where: {
    email: 'viola@prisma.io',
  },
  update: {
    name: 'Viola the Magnificent',
  },
  create: {
    email: 'viola@prisma.io',
    name: 'Viola the Magnificent',
  },
})
```

### Create (advanced)

- Create one with complex structure

```
const u = await prisma.user.create({
  include: {
    posts: {
      include: {
        categories: true,
      },
    },
  },
  data: {
    email: 'emma@prisma.io',
    posts: {
      create: [
        {
          title: 'My first post',
          categories: {
            connectOrCreate: [
              {
                create: { name: 'Introductions' },
                where: {
                  name: 'Introductions',
                },
              },
              {
                create: { name: 'Social' },
                where: {
                  name: 'Social',
                },
              },
            ],
          },
        },
        {
          title: 'How to make cookies',
          categories: {
            connectOrCreate: [
              {
                create: { name: 'Social' },
                where: {
                  name: 'Social',
                },
              },
              {
                create: { name: 'Cooking' },
                where: {
                  name: 'Cooking',
                },
              },
            ],
          },
        },
      ],
    },
  },
})
```

### Delete

- Delete one

```
const deleteUser = await prisma.user.delete({
  where: {
    email: 'bert@prisma.io',
  },
})
```

- Delete many

```
const deleteUsers = await prisma.user.deleteMany({
  where: {
    email: {
      contains: 'prisma.io',
    },
  },
})


```

- Delete all
  ```
  const deleteUsers = await prisma.user.deleteMany({})
  ```
