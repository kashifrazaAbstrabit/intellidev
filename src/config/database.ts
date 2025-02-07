// import pkg from "pg";
// import dotenv from "dotenv";

// dotenv.config();

// const { Pool } = pkg;

// export const pool = new Pool({
//   user: process.env.DB_USER as string,
//   host: process.env.DB_HOST as string,
//   database: process.env.DB_NAME as string,
//   password: process.env.DB_PASSWORD as string,
//   port: parseInt(process.env.DB_PORT as string, 10),
// });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["query"],
});

export default prisma;
