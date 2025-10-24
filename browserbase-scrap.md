# Web Scraping

> Extract structured data from websites

## Overview

Web scraping lets you extract structured data from websites. Browserbase provides a reliable browser infrastructure that helps you build scrapers that can:

* Scale without infrastructure management
* Maintain consistent performance
* Avoid bot detection and CAPTCHAs with Browserbase's [stealth mode](/features/stealth-mode)
* Provide debugging and monitoring tools with [session replays](/features/session-replay) and [live views](/features/session-live-view)

This guide will help you get started with web scraping on Browserbase and highlight best practices.

## Scraping a website

Using a sample website, we'll scrape the title, price, and some other details of books from the website.

<Card title="Follow Along: Web Scraping Example" icon="pen-to-square" iconType="sharp-solid" href="https://github.com/browserbase/example-web-scraping.git">Step-by-step code for web scraping</Card>

### Code Example

<Tabs>
  <Tab title="Node.js">
    <CodeGroup>
      ```typescript Stagehand theme={null}
      import { Stagehand } from "@browserbasehq/stagehand";
      import { z } from "zod";
      import dotenv from "dotenv";
      dotenv.config();

      const stagehand = new Stagehand({
          env: "BROWSERBASE",
          verbose: 0,
      });

      async function scrapeBooks() {
          await stagehand.init();
          const page = stagehand.page;

          await page.goto("https://books.toscrape.com/");

          const scrape = await page.extract({
              instruction: "Extract the books from the page",
              schema: z.object({
                  books: z.array(z.object({
                      title: z.string(),
                      price: z.string(),
                      image: z.string(),
                      inStock: z.string(),
                      link: z.string(),
                  }))
              }),
          });

          console.log(scrape.books);

          await stagehand.close();
          return books;
      }

      const books = scrapeBooks().catch(console.error);
      ```

      ```typescript Playwright theme={null}
      import { chromium } from "playwright-core";
      import { Browserbase } from "@browserbasehq/sdk";
      import * as dotenv from "dotenv";
      dotenv.config();

      async function createSession() {
          const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY });
          const session = await bb.sessions.create({
              projectId: process.env.BROWSERBASE_PROJECT_ID!,
          });

          return session;
      }

      async function scrapeBooks() {  
          const session = await createSession();
          const browser = await chromium.connectOverCDP(session.connectUrl);
          const defaultContext = browser.contexts()[0];
          const page = defaultContext.pages()[0];
          
          // Navigate to site
          await page.goto("https://books.toscrape.com/");

          // Extract the books from the page
          const books = await page.evaluate(() => {
              const items = document.querySelectorAll("article.product_pod");
              return Array.from(items).map(item => {
              const titleElement = item.querySelector("h3 > a");
              const priceElement = item.querySelector("p.price_color");
              const imageElement = item.querySelector("img");
              const inStockElement = item.querySelector("p.instock.availability");
              const linkElement = item.querySelector("h3 > a");

              return {
                  title: titleElement?.getAttribute("title"),
                  price: priceElement?.textContent,
                  image: imageElement?.src,
                  inStock: inStockElement?.textContent?.trim(),
                  link: linkElement?.getAttribute("href")
              };
              });
          });

          await browser.close();
          return books;
      }

      const books = scrapeBooks().catch(console.error);
      console.log(books);
      ```
    </CodeGroup>
  </Tab>

  <Tab title="Python">
    ```python Playwright theme={null}
    import os
    from playwright.sync_api import sync_playwright
    from browserbase import Browserbase
    from dotenv import load_dotenv

    load_dotenv()

    def create_session():
        """Creates a Browserbase session."""
        bb = Browserbase(api_key=os.environ["BROWSERBASE_API_KEY"])
        session = bb.sessions.create(
            project_id=os.environ["BROWSERBASE_PROJECT_ID"],
            # Add configuration options here if needed
        )
        return session

    def web_scrape():
        """Automates form filling using Playwright with Browserbase."""
        session = create_session()
        print(f"View session replay at https://browserbase.com/sessions/{session.id}")

        with sync_playwright() as p:
            browser = p.chromium.connect_over_cdp(session.connect_url)

            # Get the default browser context and page
            context = browser.contexts[0]
            page = context.pages[0]

            # Navigate to the form page
            page.goto("https://books.toscrape.com/")

            # Extract the books from the page
            items = page.locator('article.product_pod')
            books = items.all()

            book_data_list = []
            for book in books:

                book_data = {
                    "title": book.locator('h3 a').get_attribute('title'),
                    "price": book.locator('p.price_color').text_content(),
                    "image": book.locator('div.image_container img').get_attribute('src'),
                    "inStock": book.locator('p.instock.availability').text_content().strip(),
                    "link": book.locator('h3 a').get_attribute('href')
                }
                
                book_data_list.append(book_data)

            print("Shutting down...")
            page.close()
            browser.close()

            return book_data_list

    if __name__ == "__main__":
        books = web_scrape()
        print(books)
    ```
  </Tab>
</Tabs>

### Example output

```
[
  {
    title: 'A Light in the Attic',
    price: '£51.77',
    image: 'https://books.toscrape.com/media/cache/2c/da/2cdad67c44b002e7ead0cc35693c0e8b.jpg',
    inStock: 'In stock',
    link: 'catalogue/a-light-in-the-attic_1000/index.html'
  },
  ...
]
```

## Best Practices for Web Scraping

Follow these best practices to build reliable, efficient, and ethical web scrapers with Browserbase.

### Ethical Scraping

* **Respect robots.txt**: Check the website's robots.txt file for crawling guidelines
* **Rate limiting**: Implement reasonable delays between requests (2-5 seconds)
* **Terms of Service**: Review the website's terms of service before scraping
* **Data usage**: Only collect and use data in accordance with the website's policies

### Performance Optimization

* **Batch processing**: Process multiple pages in batches with [concurrent sessions](/guides/concurrency-rate-limits)
* **Selective scraping**: Only extract the data you need
* **Resource management**: Close browser sessions promptly after use
* **Connection reuse**: [Reuse browsers](/guides/long-running-sessions#using-keep-alive) for sequential scraping tasks

### Stealth and Anti-Bot Avoidance

* **Enable Browserbase Advanced Stealth mode**: Helps avoid bot detection
* **Randomize behavior**: Add variable delays between actions
* **Use proxies**: Rotate IPs to distribute requests
* **Mimic human interaction**: Add realistic mouse movements and delays
* **Handle CAPTCHAs**: Enable Browserbase's automatic CAPTCHA solving

## Next Steps

Now that you understand the basics of web scraping with Browserbase, here are some features to explore next:

<CardGroup cols={3}>
  <Card title="Stealth Mode" icon="user-secret" href="/features/stealth-mode">
    Configure fingerprinting and CAPTCHA solving
  </Card>

  <Card title="Browser Contexts" icon="browser" href="/features/contexts">
    Persist cookies and session data
  </Card>

  <Card title="Proxies" icon="network-wired" href="/features/proxies">
    Configure IP rotation and geolocation
  </Card>
</CardGroup>
