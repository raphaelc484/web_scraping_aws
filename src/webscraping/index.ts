import { PrismaClient } from "@prisma/client";
import { CronJob } from "cron";
import { format } from "date-fns";

import { webscraping } from "./webscraping";

interface IProdProps {
  name: string;
  dateToday: string;
}

async function findRegister({ name, dateToday }: IProdProps) {
  const prisma = new PrismaClient();

  const findRegister = await prisma.tbl_file_data.findFirst({
    take: 1,
    where: {
      nom_file: name,
      dat_file_publi: new Date(dateToday),
    },
  });

  return findRegister;
}

// PROGRAMA de
// ESCAVAÇÃO
// RAPIDO e
// AGIL
// LINEAR
// TEMPORAL
// AUTOMATIZADO

export async function peralta() {
  const eta40 = {
    name: "Eta40",
    dateToday: new Date(),
  };

  const gefs50 = {
    name: "Gefs50",
    dateToday: new Date(),
  };

  const ecmwf = {
    name: "ECMWF",
    dateToday: new Date(),
  };

  const products = [eta40, gefs50, ecmwf];

  for await (const product of products) {
    const checkRegister = await findRegister({
      name: product.name,
      dateToday: format(product.dateToday, "yyyy-MM-dd"),
    });

    if (!checkRegister) {
      if (product.name === "Eta40") {
        await webscraping({
          name: product.name,
          product: "549",
          numberCSS: "6419",
          dateInfo: product.dateToday,
        });
      }

      if (product.name === "Gefs50") {
        await webscraping({
          name: product.name,
          product: "550",
          numberCSS: "6416",
          dateInfo: product.dateToday,
        });
      }

      if (product.name === "ECMWF") {
        await webscraping({
          name: product.name,
          product: "551",
          numberCSS: "7642",
          dateInfo: product.dateToday,
        });
      }
    }
  }
}

// setTimeout(peralta, 15000);
const jobs = new CronJob(
  "*/8 8-10 * * *",
  async () => {
    await peralta();
  },
  null,
  true,
  "America/Sao_Paulo"
);
