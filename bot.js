require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const rp = require('request-promise')


// create a .env with TELEGRAM_TOKEN, CLIENT_ID, and CLIENT_SECRET defined in it
const token= process.env.TELEGRAM_TOKEN;
const clientId= process.env.UNTAPPD_ID;
const clientSecret= process.env.UNTAPPD_SECRET;

const baseUrl= 'https://api.untappd.com/v4'

const bot = new TelegramBot(token, {polling: true});


bot.onText(/\/beer (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  beersearch(match, chatId)
});

bot.onText(/\/brewery (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  brewerySearch(match, chatId)
});

// beer search, this queries the untappd /search/beer api, grabs the "bid" of top the search result (based on checkins),
// and queries the /beer/info enpoint with the bid for the full info on the beer.
function beersearch(match, chatId) {
  searchbeer(match)
    .then(function (body) {
      return body.response.beers.items[0].beer.bid
    })
    .catch(function (err) {
      console.log(err)
	    bot.sendmessage(chatid, "your search returned no results, try to broaden your search terms")
    })
    .then(bid => beerLookup(bid))
      .then(function (body) {
        var beerinfo = body.response.beer
        return beerinfo
      })
      .catch(function (err) {
          console.log(err)
      })
      .then(beerInfo => {
	      bot.sendPhoto(chatId, beerinfo.beer_label_hd)
	      bot.sendMessage(chatId, beerinfoformat(beerinfo))
      })
};

function brewerySearch(match, chatId) {
  searchBrewery(match)
    .then(function (body) {
      console.log(body)
      return body.response.brewery.items[0].brewery.brewery_id
      console.log(body.response.brewery.items[0].brewery.brewery_id)
    })
    .catch(function (err) {
      bot.sendMessage(chatId, "Your search returned no results, try to broaden your search terms")
    })
    .then(brewery_id => breweryLookup(brewery_id))
      .then(function (body) {
        var breweryInfo = body.response.brewery
        return breweryInfo
      })
      .catch(function (err) {
          console.log(err)
      })
      .then(breweryInfo => {
	      bot.sendPhoto(chatId, breweryInfo.brewery_label)
	      bot.sendMessage(chatId, breweryInfoFormat(breweryInfo))
      })

}

function searchbeer(match) {
  var options = {
    uri: baseUrl +'/search/beer',
    qs: {
      client_id: clientId,
      client_secret: clientSecret,
      q: match[1]
    },
    headers: {
      'User-Agent': 'Request-Promise'
    },
    json: true // Automatically parses the JSON string in the response
  };
  return rp(options)
}

function beerLookup(bid) {
  var options = {
    uri: baseUrl +'/beer/info/' +bid,
    qs: {
      client_id: clientId,
      client_secret: clientSecret,
    },
    headers: {
     'User-Agent': 'Request-Promise'
  },
    json: true
  };
  return rp(options)
}

function searchBrewery(match) {
  var options = {
    uri: baseUrl +'/search/brewery',
    qs: {
      client_id: clientId,
      client_secret: clientSecret,
      q: match[1]
    },
    headers: {
      'User-Agent': 'Request-Promise'
    },
    json: true
  };
  return rp(options)
}

function breweryLookup(brewery_id) {
  var options = {
    uri: baseUrl +'/brewery/info/' +brewery_id,
    qs: {
      client_id: clientId,
      client_secret: clientSecret,
    },
    headers: {
     'User-Agent': 'Request-Promise'
  },
    json: true
  };
  return rp(options)
}

function beerinfoformat(beerinfo) {
  var output = 'Name:' + beerinfo['beer_name'] + '\n'
  output += 'Brewery:' + beerinfo.brewery['brewery_name'] + '\n'
  output +='ABV:' + beerinfo['beer_abv'] + '\n'
  output +='IBU:' + beerinfo['beer_ibu'] + '\n'
  output +='Style:' + beerinfo['beer_style'] + '\n'
  output +='Rating:' + beerinfo['rating_score'] + '\n'
  return output
}

function breweryInfoFormat(breweryInfo) {
  var output = 'Brewery:' + breweryInfo['brewery_name'] + '\n'
  output +='City:' + breweryInfo.location['brewery_city'] + '\n'
  output +='State:' + breweryInfo.location['brewery_state'] + '\n'
  output +='Country:' + breweryInfo['country_name'] + '\n'
  output +='Rating:' + breweryInfo.rating['rating_score'] + '\n'
  return output
}





