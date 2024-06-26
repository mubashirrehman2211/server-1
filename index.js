const express = require("express");
const cors = require("cors");
const app = express();
app.use(express.json());
app.use(cors());

const puppeteer = require("puppeteer");

const bodyParser = require("body-parser");
app.use(bodyParser.json());

const PORT = process.env.PORT || 5555;

async function extractItems(page) {
  let maps_data = await page.evaluate(() => {
    return Array.from(document.querySelectorAll(".Nv2PK")).map((el) => {
      const link = el.querySelector("a.hfpxzc")?.getAttribute("href");
      const image = el.querySelector(".FQ2IWe img")?.getAttribute("src");
      return {
        title: el.querySelector(".fontHeadlineSmall")?.textContent.trim(),
        avg_rating: el.querySelector(".MW4etd")?.textContent.trim(),
        reviews: el
          .querySelector(".UY7F9")
          ?.textContent.replace("(", "")
          .replace(")", "")
          .trim(),
        address: el
          .querySelector(
            ".W4Efsd:last-child > .W4Efsd:nth-of-type(1) > span:last-child"
          )
          ?.textContent.replaceAll("·", "")
          .trim(),
        description: el
          .querySelector(".W4Efsd:last-child > .W4Efsd:nth-of-type(2)")
          ?.textContent.replace("·", "")
          .trim(),
        website: el.querySelector("a.lcr4fd")?.getAttribute("href"),
        category: el
          .querySelector(
            ".W4Efsd:last-child > .W4Efsd:nth-of-type(1) > span:first-child"
          )
          ?.textContent.replaceAll("·", "")
          .trim(),
        timings: el
          .querySelector(
            ".W4Efsd:last-child > .W4Efsd:nth-of-type(3) > span:first-child"
          )
          ?.textContent.replaceAll("·", "")
          .trim(),
        phone_num: el
          .querySelector(
            ".W4Efsd:last-child > .W4Efsd:nth-of-type(3) > span:last-child"
          )
          ?.textContent.replaceAll("·", "")
          .trim(),
        extra_services: el
          .querySelector(".qty3Ue")
          ?.textContent.replaceAll("·", "")
          .replaceAll("  ", " ")
          .trim(),
        latitude: link.split("!8m2!3d")[1].split("!4d")[0],
        longitude: link.split("!4d")[1].split("!16s")[0],
        link,
        image,
        dataId: link.split("1s")[1].split("!8m")[0],
      };
    });
  });
  return maps_data;
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function scrollPage(page, scrollContainer, itemTargetCount) {
  let items = [];
  let previousHeight = await page.evaluate(
    `document.querySelector("${scrollContainer}").scrollHeight`
  );
  while (itemTargetCount > items.length) {
    items = await extractItems(page);
    await page.evaluate(
      `document.querySelector("${scrollContainer}").scrollTo(0, document.querySelector("${scrollContainer}").scrollHeight)`
    );
    await page.evaluate(
      `document.querySelector("${scrollContainer}").scrollHeight > ${previousHeight}`
    );
    await sleep(2000);
  }
  return items;
}

app.listen(PORT, () => {
  console.log("Server Listening on PORT:", PORT);
});

// POST Endpoint

app.post("/sending", async (req, res) => {
  let city = req.body;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--disabled-setuid-sandbox", "--no-sandbox"],
    });

    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4882.194 Safari/537.36",
    });

    await page.goto(
      `https://www.google.com/maps/search/${city.type}/@${city.lat},${city.lng},12z/data=!3m1!4b1`,
      {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      }
    );

    await sleep(6000);

    let data = await scrollPage(page, ".m6QErb[aria-label]", 7);

    console.log(data);

    await browser.close();

    res.send(data);
  } catch (err) {
    res.status(400).json({ err: "Data Not Found, please try again" });
  }
});

// GET Endpoint

// app.get("/data", (request, response) => {
//   response.send(data);
// });
