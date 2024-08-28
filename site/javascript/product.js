document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  
  if (!productId) {
    console.error('Product ID not found in URL');
    return;
  }

  fetch('../scraper/data.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      const product = data.products[productId];
      const pricing = data.pricing;



      if (!product) {
        console.error('Product not found');
        return;
      }


      // TTLE
      document.getElementById('product-name').textContent = product.name;
      document.getElementById('product-category').textContent = product.category_name;
      //

      // DATA
      // Image ->
      document.getElementById('product-image').src = product.image_url;
      document.getElementById('product-image').alt = product.slug;
      // Format
      document.getElementById('product-format').textContent = product.packaging + " " + product.price_instructions.unit_size + " " + product.price_instructions.reference_format || " - - - "
      document.getElementById('product-price-per-volume').textContent = product.price_instructions.bulk_price + " € / "  + product.price_instructions.reference_format || " - - - "
      document.getElementById('product-price').textContent = product.price_instructions.unit_price + " €" || '- - -'
      //
      renderPriceChart(product, pricing);
    })
    .catch(error => console.error('Error fetching product details:', error));
});

function renderPriceChart(product, pricing) {
  const prices = pricing[product.category_name][product.id]["prices"]
  const dates = Object.keys(prices).sort((a, b) => new Date(a) - new Date(b));
  const priceData = dates.map(date => prices[date].price);
  const ctx = document.getElementById('priceChart').getContext('2d');

  if (!ctx) {
    throw new Error('Unable to get context for priceChart');
  }

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [{
        label: '€',
        data: priceData,
        borderColor: 'blue',
        backgroundColor: 'rgba(0, 0, 255, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'white',
                        pointBorderColor: 'green',
        pointRadius: 5,
      }]
    },
    options: {
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'day',
                                tooltipFormat: 'YYYY-MM-DD',
          },
          title: {
                                display: false,
            text: 'Date',
          },
          grid: {
            display: false,
          }
        },
        y: {
          title: {
            display: true,
            text: '€ ',
          },
          grid: {
            display: false,
          }
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  });
}
