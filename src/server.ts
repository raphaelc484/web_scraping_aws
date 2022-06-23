import cors from "cors";
import express from "express";

import { peralta } from "./webscraping";

const app = express();

app.use(cors());
app.use(express.json());
app.use(peralta);
// app.use(routes);

app.listen(process.env.PORT || 3333, () => {
  console.log("HTTP server running - 3333");
});
