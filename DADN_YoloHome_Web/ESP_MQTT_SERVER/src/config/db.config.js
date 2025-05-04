module.exports = {
    user: process.env.PG_USER || "anh",
    host: process.env.PG_HOST || "localhost",
    database: process.env.PG_DATABASE || "postgres",
    password: process.env.PG_PASSWORD || "IamAnh123",
    port: process.env.PG_PORT || 5432
  };
  