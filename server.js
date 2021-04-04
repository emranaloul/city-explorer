/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
'use strict';

const express = require( 'express' );

require( 'dotenv' ).config();

const cors = require( 'cors' );

const server = express();

const PORT = process.env.PORT || 5000;

server.use( cors() );

server.listen( PORT,()=>{
  console.log( `Listening on PORT ${PORT}` );
} );

server.get( '/' , ( req , res ) => {
  res.send( 'you are working fine' );
} );

server.get( '/location', ( req , res )=>{
  let geoData = require( './data/location.json' );

  let locationData = new Location ( geoData );
  res.send( locationData );

} );

function Location( locData ){

  // {
  //     "search_query": "seattle",
  //     "formatted_query": "Seattle, WA, USA",
  //     "latitude": "47.606210",
  //     "longitude": "-122.332071"
  //   }
  this.search_query = 'Lynnwood';
  this.formatted_query = locData[0].display_name;
  this.latitude = locData[0].lat;
  this.longitude = locData[0].lon;


}

server.get( '/weather', ( req , res )=>{
  let forecast = require( './data/weather.json' );

  forecast.data.forEach( ( element ) => {
    let weatherData = new Weather ( element );
  } );
  res.send( Weather.all );
  Weather.all = [];
} );


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
  Weather.all.push( this );

}
Weather.all = [];

server.get( '*', ( req , res )=>{
  let errObj = {
    status: 500,
    responseText: 'Sorry, something went wrong'
  };

  res.status( 500 ).send( errObj );

} );
