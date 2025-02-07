import dotenv from "dotenv";
dotenv.config(); // Load environment variables first

import app from "./app";

const PORT = process.env.PORT || 8000;
console.log("Database user:", process.env.DB_USER);

app.listen(PORT, async () => {
  try {
    console.log("Connected to the database successfully!");
  } catch (error) {
    console.error("Error connecting to the database:", error);
  }

  console.log(`Server is running on port ${PORT}`);
});
