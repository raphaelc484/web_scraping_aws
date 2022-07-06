/* eslint-disable no-await-in-loop */
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

  await prisma.$connect();

  const findRegister = await prisma.tbl_file_data.findFirst({
    take: 1,
    where: {
      nom_file: name,
      dat_file_publi: new Date(dateToday),
    },
  });

  await prisma.$disconnect();

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

  for (let i = 0; i < products.length; i += 1) {
    const checkRegister = await findRegister({
      name: products[i].name,
      dateToday: format(products[i].dateToday, "yyyy-MM-dd"),
    });

    if (!checkRegister) {
      if (products[i].name === "Eta40") {
        await webscraping({
          name: products[i].name,
          product: "549",
          numberCSS: "6419",
          dateInfo: products[i].dateToday,
        });
      }

      if (products[i].name === "Gefs50") {
        await webscraping({
          name: products[i].name,
          product: "550",
          numberCSS: "6416",
          dateInfo: products[i].dateToday,
        });
      }

      if (products[i].name === "ECMWF") {
        await webscraping({
          name: products[i].name,
          product: "551",
          numberCSS: "7642",
          dateInfo: products[i].dateToday,
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
