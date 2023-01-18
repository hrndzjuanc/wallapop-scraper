const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const config = { "urlToScrape": process.env['URLTOSCRAPE'], "telegramToken" : process.env['BOT_TOKEN'], "chatId" : process.env['BOT_CHATID']}
const bot = new TelegramBot( config.telegramToken, {polling: true});

const scraperObject = {
	async scraper(browser){

		let firstTime = true;
		let lastListingUrl = null;
		
		// Open browser 
		let page = await browser.newPage();
		const pageTarget = page.target(); // Save this as the main page

		async function scrapeCurrentPage(){

			// Go to url
			await page.goto(config.urlToScrape);
			await page.waitForTimeout(1000)

			// Accept cookies on first time
			if ( firstTime ){
				await page.waitForSelector('#onetrust-accept-btn-handler');
				await page.click('#onetrust-accept-btn-handler');
				firstTime = false;
			}

			// Click first listing
			await page.waitForSelector('.ItemCardList__item');
			await page.waitForTimeout(1000)
			await page.click('.ItemCardList__item');

			// Check that you opened this page, rather than just checking the url
			const newTarget = await browser.waitForTarget(target => target.opener() === pageTarget); 
			const newPage = await newTarget.page(); //get the page object
			await newPage.waitForSelector("body"); //wait for page to be loaded

			if ( lastListingUrl === null) lastListingUrl = newPage.url();
			if ( newPage.url() == lastListingUrl) console.log('No hay nuevo anuncio');
			else {

				console.log('¡Nuevo anuncio! URL: ' + newPage.url())
				bot.sendMessage( config.chatId , '¡Nuevo anuncio publicado! URL: ' + newPage.url() );
				lastListingUrl = newPage.url(); 
				
			}

			newPage.close();
			await page.waitForTimeout(30000)
			await scrapeCurrentPage();

		}
		await scrapeCurrentPage();
	}
}

module.exports = scraperObject;