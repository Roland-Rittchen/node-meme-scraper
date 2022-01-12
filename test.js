// Loading the dependencies. We don't need pretty
// because we shall not log html to the terminal
import axios from 'axios';
import cheerio from 'cheerio';

// const fs = require("fs");

// URL of the page we want to scrape
const url = 'https://memegen-link-examples-upleveled.netlify.app/';

// Async function which scrapes the data
async function scrapeData() {
  try {
    // Fetch HTML of the page we want to scrape
    const { data } = await axios.get(url);
    // Load HTML we fetched in the previous line
    const $ = cheerio.load(data);

    // Select all the list items in plainlist class
    const listItems = $('img');
    // Stores data for all countries
    for (let i = 1; i <= 10; i++) {
      console.log(listItems[i]['attribs']['src']);
    }
  } catch (err) {
    console.error(err);
  }
}
// Invoke the above function
void scrapeData();
