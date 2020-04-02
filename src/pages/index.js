import React from 'react';
import Helmet from 'react-helmet';
import L from 'leaflet';
import axios from 'axios'; //for Http requests
import Layout from 'components/Layout';
import Container from 'components/Container';
import Map from 'components/Map';

//THIS APPLICATION USES CORONAVIRUS TRACKER API TO MAP OUT CASES BASED ON COUNTRIES ACROSS THE GLOBE



const LOCATION = { //0,0 centers the view of the map on load
  lat: 0,
  lng: 0
};
const CENTER = [LOCATION.lat, LOCATION.lng];
const DEFAULT_ZOOM = 2;

const IndexPage = () => {


  /**
   * mapEffect
   * @description Fires a callback once the page renders
   * @example Here this is and example of being used to zoom in and set a popup on load
   */

  async function mapEffect({ leafletElement: map } = {}) {
    if (!map) {
      return;
    }
    let response; //to store responses
    try {  //try/catch to get over API errors

      response = await axios.get('https://corona.lmao.ninja/countries');

    } catch (e) {  //if request fails we console log out the error and return 

      console.log(`Failed to fetch countries: ${e.message}`, e);
      return;

    }
    const { data = [] } = response;  //destructuring data into 'data' array
    const hasData = Array.isArray(data) && data.length > 0; //checks that data is available or not

    if ( !hasData ) return; //returns if data is inaccessible

    const geoJson = {
      type: 'FeatureCollection',
      features: data.map((country = {}) => {
        const { countryInfo = {} } = country;
        const { lat, long: lng } = countryInfo; //gets lats/long for countries
        return {
          type: 'Feature',
          properties: {
            ...country,
          },
          geometry: {
            type: 'Point',
            coordinates: [ lng, lat ]
          }
        }
      })
    }


    const geoJsonLayers = new L.GeoJSON(geoJson, {  //transforming data into geographic format, as fed into Leaflet
      pointToLayer: (feature = {}, latlng) => { //to customize Leaflet map layers
        const { properties = {} } = feature;
        let updatedFormatted;
        let casesString;

        const {  
          country,
          updated,
          cases,
          deaths,
          recovered
        } = properties

        casesString = `${cases}`;

        if ( cases > 1000 ) {
          casesString = `${casesString.slice(0, -3)}k+`  //converts 1000 to 1k and so on for easier visibility.
        }

        if ( updated ) {
          updatedFormatted = new Date(updated).toLocaleString();
        }
        
        //basic template for the output pop-up
        const html = `
          <span class="icon-marker">
            <span class="icon-marker-tooltip">
              <h2>${country}</h2>  
              <ul>
                <li><strong>Confirmed:</strong> ${cases}</li>
                <li><strong>Deaths:</strong> ${deaths}</li>
                <li><strong>Recovered:</strong> ${recovered}</li>
                <li><strong>Last Update:</strong> ${updatedFormatted}</li>
              </ul>
            </span>
            ${ casesString }
          </span>
        `;

        return L.marker( latlng, {
          icon: L.divIcon({
            className: 'icon', //icon is the marker
            html
          }),
          riseOnHover: true //to make selected marker rise above others
        });
      }
    });

    geoJsonLayers.addTo(map)
  }

  const mapSettings = {
    center: CENTER,
    defaultBaseMap: 'OpenStreetMap',
    zoom: DEFAULT_ZOOM,
    mapEffect
  };

  return (
    <Layout pageName="home">
      <Helmet>
        <title>Covid-19 Tracker</title>
      </Helmet>

      <h1 className="text-center main-heading">COVID 19 TRACKER</h1>

      <Map {...mapSettings}/>

      <Container type="content" className="text-center home-start">
        <h2>Global tracking for COVID-19 cases: Confirmed, Deaths & Recovery</h2>
        <p>Sourcing data from <a href="https://github.com/novelcovid/api">NovelCOVID API</a>, based on:</p>
        <p><a href= "https://www.worldometers.info/coronavirus/">https://www.worldometers.info/coronavirus</a> and,</p>
        <p><a href="https://github.com/CSSEGISandData/COVID-19/tree/master/csse_covid_19_data/csse_covid_19_time_series">https://github.com/CSSEGISandData/COVID-19/tree/master/csse_covid_19_data/csse_covid_19_time_series</a></p>
      </Container>
    </Layout>
  );
};

export default IndexPage;
