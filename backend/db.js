import pkg from "pg";
import dotenv from "dotenv";

const { Pool } = pkg;

dotenv.config();

const { DATABASE_URL, DEVELOPMENT } = process.env;

let pool;

if (DEVELOPMENT === "false") {
	pool = new Pool({
		connectionString: DATABASE_URL,
		ssl: {
			rejectUnauthorized: false,
		},
	});
} else {
	pool = new Pool({
		user: "postgres",
		password: "061218@Abc",
		host: "localhost",
		port: 5432,
		database: "job_tracker",
		ssl: false,
	});
}

export default pool;
