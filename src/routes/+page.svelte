<script>
  import CardResto from "#lib/components/CardResto.svelte";
import { onMount } from "svelte";

  /**
   * @type {HTMLDivElement | null}
   */
  let mapElem = $state(null);
  let showDetails = $state(false);
  let km = $state(1);


let {data } = $props();
let restaurantDetails = $state(null);
let filteredRestaurants = $state(data.restaurants);
filteredRestaurants = mergeRestaurantTags(filteredRestaurants);
console.log("filteredRestaurants:", filteredRestaurants);
let filteredRestaurantsRanked = $state(filteredRestaurants.filter(restaurant => restaurant.list_status !== "want_to_try"));
let filteredRestaurantsWantToTry = $state(filteredRestaurants.filter(restaurant => restaurant.list_status === "want_to_try"));
let AllTags = $state(data.tags);
let selectedTags = $state(null);
let selectedFilter = $state("Ranked");
let selectedTag = $state(null);
console.log("AllTags:", AllTags);



 function toggleDetails(restaurant) {
        if (restaurantDetails === restaurant) {
            restaurantDetails = null;
        } else {
            restaurantDetails = restaurant;
        }
    }

function changeFilter(filterType) {
    if (filterType === "ranked") {
        selectedFilter = "Ranked";
        filteredRestaurants = filteredRestaurantsRanked;
    } else if (filterType === "WantToTry") {
        selectedFilter = "WantToTry";
        filteredRestaurants = filteredRestaurantsWantToTry;
    }
}

function filterByTag(tag) {
    if (tag === null) {
        selectedTags = null;
        selectedTag = null;
        filteredRestaurants = mergeRestaurantTags(data.restaurants);
    } else {
        selectedTags = tag;
        selectedTag = tag;
        filteredRestaurants = data.restaurants
            .filter(restaurant => restaurant.tag_id === tag.id || restaurant.tags?.includes(tag.id));
    }
}

function mergeRestaurantTags(restaurants) {
    const tagMap = new Map();
    if (!restaurants || restaurants.length === 0) {
        return [];
    }
    restaurants.forEach(restaurant => {
        const key = restaurant.id;
        const existing = tagMap.get(key);
        const tagIds = existing?.tags ?? [];

        if (restaurant.tag_id != null && !tagIds.includes(restaurant.tag_id)) {
            tagIds.push(restaurant.tag_id);
        }

        if (existing) {
            existing.tags = tagIds;
        } else {
            tagMap.set(key, {
                ...restaurant,
                tags: tagIds,
            });
        }
    });
    return Array.from(tagMap.values());
}

  onMount(async () => {
    const Leaflet = await import("leaflet");
    const map = Leaflet.map(mapElem, {zoomControl: false}).setView([51.505, -0.09], 13);

    Leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
	}).addTo(map);
    if(!data.center || !data.center.lat || !data.center.long) {
    //   console.error("Invalid center coordinates:", data.center);
      return;
    }
    Leaflet.control.zoom({ position: "bottomright" }).addTo(map);
    
    map.setView([data.center.lat, data.center.long], 16);

    Leaflet.marker([data.center.lat, data.center.long])
      .addTo(map)
      .bindPopup("Adresse recherchée")
      .openPopup();
    console.log("data.center:", km);
    Leaflet.circle([data.center.lat, data.center.long], {
      color: "blue",
      fillColor: "#30f",
      fillOpacity: 0.2,
      radius: data.center.km * 1000,
    }).addTo(map);

    data.restaurants.forEach((restaurant) => {
        Leaflet.marker([restaurant.latitude, restaurant.longitude])
        .addTo(map)
        .bindPopup(restaurant.name);
    });
    if (data.restaurants.length > 0) {
        showDetails = true;
    }
  });  
</script>

<form method="post" action="?/searchPlace" class="search-form">
  <input
    type="text"
    placeholder="Rechercher une adresse..."
    name = "place"
  />
    <select name="km" bind:value={km}>
        <option value={1}>1 km</option>
        <option value={3}>3 km</option>
        <option value={5}>5 km</option>
        <option value={10}>10 km</option>
    </select>
  <button type="submit">Rechercher</button>
</form>


{#if restaurantDetails}
    <dialog open>
        <button onclick={() => toggleDetails(null)}>Fermer les détails</button>
        <h2>Détails du restaurant</h2>
        <p>Nom: {restaurantDetails.name}</p>
        <p>Adresse: {restaurantDetails.address}</p>
        <p>Latitude: {restaurantDetails.latitude}</p>
        <p>Longitude: {restaurantDetails.longitude}</p>
    </dialog>
    {:else}
    {#if showDetails}
    <dialog open class="liste-resto">
        <h1>Tastemap</h1>
        <p class="center-info">{data.center.name} - {km}km radius - {data.restaurants.length} places</p>
        <h2>Your top tables</h2>
        <p>Ranked head-to-head, so your #3 really is better than your #4 — no five-star mush.</p>
        <ul class="filter-list">
            <li onclick={() => changeFilter("ranked")} class:selected={selectedFilter === "Ranked"}>Ranked <span>{filteredRestaurantsRanked.length}</span></li>
            <li onclick={() => changeFilter("WantToTry")} class:selected={selectedFilter === "WantToTry"}>Want to try <span>{filteredRestaurantsWantToTry.length}</span></li>
        </ul>
        <ul class="tag-list">
        <li onclick={() => {filterByTag(null)}} class:selected={selectedTag === null}>All</li>
            {#each AllTags as tag}
                <li onclick={() => {filterByTag(tag)}} class:selected={selectedTag === tag}> {tag.name}</li>
            {/each}
        </ul>
        <ul class="restaurant-list">
            {#if filteredRestaurants.length === 0}
                <li>No restaurants found for the selected filter/tag.</li>
            {:else}
                {#each filteredRestaurants as restaurant}
                <CardResto {restaurant} onclick={() => toggleDetails(restaurant)} />
                {/each}
            {/if}

        </ul>
    </dialog>
{/if}
{/if}

<div bind:this={mapElem} id="map"></div>

<style>
    dialog {
        height: 100vh;
        z-index: 1000;
        margin: 0;
    }

    .liste-resto {
        box-sizing: border-box;
        position: fixed;
        top: 0;
        left: 0;
        width: 440px;
        height: 100dvh;
        padding: 16px 14px 0;
        border: 0;
        background: #fbfbf8;
        color: #242424;
        box-shadow: 2px 0 14px rgb(0 0 0 / 18%);
        overflow: hidden;
        font-family: Arial, Helvetica, sans-serif;
    }

    .liste-resto::backdrop {
        background: transparent;
    }

    .liste-resto h1,
    .liste-resto h2,
    .liste-resto p {
        margin-top: 0;
    }

    .liste-resto h1 {
        margin-bottom: 16px;
        font-family: Georgia, "Times New Roman", serif;
        line-height: 1;
    }

    .liste-resto h2 {
        margin-bottom: 6px;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 17px;
        line-height: 1.1;
    }

    .center-info {
        display: inline-block;
        margin-bottom: 13px;
        padding: 4px 8px;
        border: 0;
        border-radius: 999px;
        background: #edf2eb;
        color: #4b6250;
        font-size: 16px;
        line-height: 1;
    }

    .liste-resto > p:not(.center-info) {
        margin-bottom: 12px;
        color: #777;
        font-size: 16px;
        line-height: 1.35;
    }

    .filter-list,
    .tag-list,
    .restaurant-list {
        display: flex;
        margin: 0;
        padding: 0;
        list-style: none;
    }

    .filter-list {
        gap: 22px;
        border-bottom: 1px solid #deded9;
    }

    .filter-list li {
        padding: 0 0 8px;
        color: #777;
        font-size: 16px;
        cursor: pointer;
    }

    .filter-list .selected {
        border-bottom: 2px solid #30352d;
        color: #282d27;
    }

    .filter-list span {
        color: #999;
    }

    .tag-list {
        gap: 4px;
        margin: 8px 0 10px;
        overflow-x: scroll;
        white-space: nowrap;
    }

    .tag-list li {
        flex: 0 0 auto;
        padding: 10px 16px;
        border: 1px solid #deded9;
        border-radius: 999px;
        background: #f2f2ef;
        color: #555;
        font-size: 16px;
        cursor: pointer;
    }

    .tag-list .selected {
        background: #3E6B48;
        color: #fff;
    }

    .restaurant-list {
        display: block;
        height: calc(100dvh - 181px);
        margin: 0 -14px;
        padding: 0 14px;
        overflow-y: auto;
    }

    .restaurant-list :global(li) {
        margin: 0;
        padding: 8px 0;
        border-bottom: 1px solid #e8e8e3;
        list-style: none;
    }

    .restaurant-list :global(button) {
        display: grid;
        grid-template-columns: 23px 1fr;
        gap: 8px;
        width: 100%;
        padding: 0;
        border: 0;
        background: transparent;
        color: inherit;
        text-align: left;
        cursor: pointer;
    }

    .restaurant-list :global(button)::before {
        content: counter(restaurant);
        counter-increment: restaurant;
        align-self: center;
        color: #333;
        font-size: 16px;
        font-weight: 700;
    }

    .restaurant-list {
        counter-reset: restaurant;
    }

    .restaurant-list :global(button h2) {
        margin: 0 0 4px;
        overflow: hidden;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 16px;
        font-weight: 700;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .restaurant-list :global(button p) {
        margin: 0;
        overflow: hidden;
        color: #777;
        font-size: 16px;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    #map {
        height: 100dvh;
    }

   .leaflet-container {
		height: 400px;
		width: 600px;
		max-width: 100%;
		max-height: 100%;
	}

    .search-form {
        position: absolute;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1000;
        background-color: white;
        padding: 8px 22px;
        border-radius: 50px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    }

    .search-form input {
        border: none;
        border-radius: 4px;
        padding: 8px;
        width: 200px;
    }

    .search-form button {
        border: none;
        background-color: #007BFF;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
    }

    .search-form button:hover {
        background-color: #0056b3;
    }

    .search-form select {
        border: 1px solid #ccc;
        border-radius: 50px;
        padding: 8px;
        margin-left: 8px;
        outline: none;
        appearance: none;
        padding-right: 0;
        width: 65px;
    }

    .search-form select:focus {
        border-color: #007BFF;
    }

</style>