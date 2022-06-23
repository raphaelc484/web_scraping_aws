import { format } from "date-fns";
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

import { uploadFileS3 } from "../s3";

interface IProdProps {
  name: string;
  product: string;
  numberCSS: string;
  dateInfo: Date;
}

export async function webscraping({
  name,
  product,
  numberCSS,
  dateInfo,
}: IProdProps) {
  const dateCheck = format(dateInfo, "dd/MM/yyyy");

  const pathBase = path.resolve(__dirname, "..", "..", "tmp");

  const browser = await puppeteer.launch({
    // headless: false,
  });
  const page = await browser.newPage();

  try {
    await page.goto(
      "https://sintegre.ons.org.br/sites/9/38/paginas/servicos/historico-de-produtos.aspx"
    );
    await page.waitForXPath('//*[@id="username"]');
    await page.type("#username", process.env.SINTEGRE_USERNAME || "");
    await page.click('[type="submit"]');
    await page.waitForNavigation();
    await page.waitForTimeout(1000);
    await page.type("#password", process.env.SINTEGRE_PASSWORD || "");
    await page.click('[type="submit"]');
    await page.waitForTimeout(1000);
    await page.waitForNavigation();

    await page.title();

    await page.waitForSelector(".site-atual");

    await page.waitForSelector(`#tituloproduto-${numberCSS}`);

    const nameFile = await page.$eval(
      `.item_produto_a6dbcb54 .item_produto_corpo_a6dbcb54 #linkproduto-${numberCSS}`,
      (x) => x.textContent?.trim()
    );

    const datePub = await page.$eval(
      `.corpo_produto_a6dbcb54[data-item-produto="${product}"] small`,
      (x) => x.textContent?.split("Publicado: ")[1].split(" ")[0]
    );

    if (datePub === dateCheck) {
      await (page as any)._client.send("Page.setDownloadBehavior", {
        behavior: "allow",
        downloadPath: pathBase,
      });

      await page.click(
        `.item_produto_a6dbcb54 .item_produto_corpo_a6dbcb54 #linkproduto-${numberCSS}`
      );

      await page.waitForTimeout(8000);

      const findFile = fs.readdirSync(pathBase);
      const checkName = findFile.find((f) => f === nameFile) || null;

      if (checkName) {
        await uploadFileS3({
          nameDir: name,
          nameFile: checkName,
          pathBase,
        });
        await (page as any)._client.send("Network.clearBrowserCookies");
        await page.close();
      }
    }
  } catch (error) {
    console.log("Erro de timing");
    await (page as any)._client.send("Network.clearBrowserCookies");
    await page.close();
  }
}
