import axios from 'axios';
import cheerio from 'cheerio';

// url to the website to be scraped
const url = 'https://memegen-link-examples-upleveled.netlify.app/';

// function to get entire html code from the website provided
async function getSite(siteUrl) {
  try {
    // Fetch HTML of the page we want to scrape
    const { data } = await axios.get(siteUrl);
    return data;
  } catch (err) {
    console.error(err);
  }
}

// function extracting image urls from html text
function getImgUrls(siteHtml) {
  // console.log(siteHtml);
  // Load HTML we fetched in the previous line
  const $ = cheerio.load(siteHtml);
  // Select all the list items in plainlist class
  const listItems = $('img');
  // extract first 10 img links
  const list = [];
  for (let i = 0; i < 10; i++) {
    let imgUrl = listItems[i]['attribs']['src'];
    // cleanup link
    imgUrl = imgUrl.replace('?width=300', '');
    console.log(imgUrl);
    list.push(imgUrl);
  }
  return list;
}

const urlSite = await getSite(url);
const linkList = getImgUrls(urlSite);
console.log(linkList);
