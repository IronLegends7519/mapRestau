import { getRestaurantByGeo, getAllTag } from '#lib/server/database.js';
import { redirect } from '@sveltejs/kit';

const KM_PAR_DEGRE_LAT = 111.32;

/**
 * 
 * @param {{lat:number, long:number}} centre 
 * @param {number} rayonKm 
 * @returns 
 */
function boundingBox(centre, rayonKm = 1) {
    const { lat, long } = centre;

    const deltaLat = Number(Number(rayonKm) / KM_PAR_DEGRE_LAT);

    const deltaLong = Number(Number(rayonKm) / (KM_PAR_DEGRE_LAT * Math.cos((lat * Math.PI) / 180)));

    return {
        latMin: lat - deltaLat,
        latMax: lat + deltaLat,
        longMin: long - deltaLong,
        longMax: long + deltaLong,
    };
    }

export const load = ({ url }) => {

    const lat = Number(url.searchParams.get('lat'));
    const long = Number(url.searchParams.get('long'));
    const km = Number(url.searchParams.get('km')) || 1;
    console.log('Rayon (km):', km);
    const bounding = boundingBox({ lat, long }, km);
    console.log('Bounding box:', bounding);
    const restaurants = getRestaurantByGeo(bounding.latMin, bounding.latMax, bounding.longMin, bounding.longMax);
    const tags = getAllTag();
    return {
        center: {
            lat,
            long,
            name: url.searchParams.get('place') || 'Adresse inconnue',
            km
        }, 
        restaurants,
        tags
    };
}

export const actions = {

    searchPlace: async ({ request }) => {
        const data = await request.formData();
        const placeRequest = data.get('place');
        const km = data.get('km') || 1;
        console.log('Rayon (km):', km);
        const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(placeRequest)}`,
        {
            headers: {
                "User-Agent": "MonApp/1.0 (contact@monsite.com)",
            },
        }
    );

    const places = await response.json();
    // const places = [{
    //   lat: "51.505",
    //   lon: "-0.09"
    // }];

    if (places.length === 0) {
      alert("Adresse introuvable");
      return;
    }

    const place = places[0];
    const latitude = Number(place.lat);
    const longitude = Number(place.lon);

    redirect(301, `/?place=${encodeURIComponent(place.name)}&lat=${latitude}&long=${longitude}&km=${km}`);
}
}
        
