/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
'use strict';

const express = require( 'express' );

require( 'dotenv' ).config();

const cors = require( 'cors' );

const server = express();

const PORT = process.env.PORT || 5000;

server.use( cors() );

// const client = new pg.Client( process.env.DATABASE_URL );

const client = new pg.Client( { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false}} );
// server.listen( PORT,()=>{
//   console.log( `Listening on PORT ${PORT}` );
// } );

server.get( '/' , homeRouteHandler );
server.get( '/location', locationHandler );
server.get( '/weather', weatherHandler ) ;
server.get( '/parks', parkHandler );





function homeRouteHandler ( req , res ) {
  res.send( 'you are working fine' );
}

const superagent = require( 'superagent' );

// http://localhost:3030/location?city=amman
function locationHandler ( req , res ) {
  console.log( 'starting locationi handling' );
  let cityName = req.query.city;
  console.log( cityName );
  let key = process.env.LOCATION_KEY;
  let locURL = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${cityName}&format=json`;

  let SQL = 'SELECT search_query FROM locations';
  client.query( SQL )
    .then( locoData =>{
      console.log( locoData.rows );

      let locationArr = locoData.rows.map( element =>{
        return element.search_query;
      } );
      if( locationArr.includes( cityName ) ){
        console.log( 'we are working on DATABASE' );
        let SQL2 = 'SELECT * FROM locations WHERE search_query = $1;';
        let safeValues = [cityName];
        client.query( SQL2 , safeValues )
          .then( geoData =>{

            let gData = geoData.rows[0];

            res.send( gData );

          } // then function ;
          );//then
      }//if
      else{
        console.log( 'we are working on API' );
        superagent.get( locURL )
          .then( geoData =>{
            let gData = geoData.body;
            let locationData = new Location( cityName, gData );
            let search_query = locationData.search_query;
            let formatted_query = locationData.formatted_query;
            let latitude = locationData.latitude;
            let longitude = locationData.longitude;
            let SQL = 'INSERT INTO locations (search_query,formatted_query,latitude,longitude) VALUES ($1,$2,$3,$4) RETURNING *;';
            let safeValues = [search_query,formatted_query,latitude,longitude];
            client.query( SQL, safeValues )
              .then( result =>{
                console.log( result.rows[0] );
                res.send( result.rows[0] );
              } );


          } );

      }
    }//then function
    )//then
    .catch( error=>{
      res.send( error );
    } );
}//function

function Location( cityName , locData ){

  // {
  //     "search_query": "seattle",
  //     "formatted_query": "Seattle, WA, USA",
  //     "latitude": "47.606210",
  //     "longitude": "-122.332071"
  //   }
  this.search_query = cityName;
  this.formatted_query = locData[0].display_name;
  this.latitude = locData[0].lat;
  this.longitude = locData[0].lon;


}
// http://localhost:3030/weather?search_query=Lynnwood&formatted_query=Lynnwood%2C%20Snohomish%20County%2C%20Washington%2C%20USA&latitude=47.8278656&longitude=-122.3053932&page=1
function weatherHandler ( req , res ){

  // let cityName = req.query.search_query;
  let lat = req.query.latitude;
  let lon = req.query.longitude;
  // let cityFormat = req.query.formatted_query;
  let key = process.env.WEATHER_KEY;
  let weaURL = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${lat}&lon=${lon}&days=5&key=${key}`;
  superagent.get( weaURL )
    .then( weathData =>{
      let weatherArr = weathData.body.data.map( ( element ) => {

        return new Weather ( element );

      } );

      res.send( weatherArr );
    }

    )
    .catch( error=>{
      res.send( error );
    } );}


function Weather( weaData ){

  //    [
  //   {
  //     "forecast": "Partly cloudy until afternoon.",
  //     "time": "Mon Jan 01 2001"
  //   },
  //   {
  //     "forecast": "Mostly cloudy in the morning.",
  //     "time": "Tue Jan 02 2001"
  //   },
  //   ...
  // ]

  this.forecast = weaData.weather.description;
  this.time = weaData.valid_date;


}
// http://localhost:3030/parks?search_query=amman&formatted_query=Amman%2C%2011181%2C%20Jordan&latitude=31.9515694&longitude=35.9239625&page=1
function parkHandler( req,res ){

  let key = process.env.PARK_KEY;
  let cityName = req.query.search_query;
  let parkURL = `https://developer.nps.gov/api/v1/parks?q=${cityName}&limit=10&api_key=${key}`;
  superagent.get( parkURL )
    .then( parkData=>{
      let parksArr = parkData.body.data.map( ( element ) => {

        return new Park ( element );

      } );
      res.send( parksArr );
    }
    )
    .catch( error=>{
      res.send( error );
    } );

}

function Park ( pData ){
  // {
  //   "name": "Klondike Gold Rush - Seattle Unit National Historical Park",
  //   "address": "319 Second Ave S., Seattle, WA 98104",
  //   "fee": "0.00",
  //   "description": "Seattle flourished during and after the Klondike Gold Rush. Merchants supplied people from around the world passing through this port city on their way to a remarkable adventure in Alaska. Today, the park is your gateway to learn about the Klondike Gold Rush, explore the area's public lands, and engage with the local community.",
  //   "url": "https://www.nps.gov/klse/index.htm"
  //  },

  this.name = pData.fullName;
  this.address = pData.addresses[0].line1;
  this.fee = pData.fee;
  this.description = pData.description;
  this.url = pData.url;

}




server.get( '*', ( req , res )=>{
  let errObj = {
    status: 500,
    responseText: 'Sorry, something went wrong'
  };

  res.status( 500 ).send( errObj );

} );

client.connect()
  .then( () => {
    server.listen( PORT, () =>
      console.log( `listening on ${PORT}` )
    );
  } );

