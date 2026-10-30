<script>
    let { restaurant, onclick } = $props();

   
</script>

<li>
    <button on:click={onclick}>
        <h2>{restaurant.name}</h2>
        <p>{restaurant.address}</p>
    </button>
</li>