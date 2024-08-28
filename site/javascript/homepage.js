document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('search-input');
  const contentDiv = document.getElementById('content');
  const chartContainer = document.querySelector('.chart-container');
  const chartSelector = document.querySelector('.chart-selector');

  if (!searchInput || !contentDiv || !chartContainer || !chartSelector) {
    console.error('One or more elements not found');
    return;
  }

  let categories, products, pricing;

  function selectCategory(categoryId) {
    // Remove 'active' class from all category items
    document.querySelectorAll('.category-list li').forEach(item => {
      item.classList.remove('active');
    });

    // Add 'active' class to selected category
    const selectedItem = document.querySelector(`[data-category-id="${categoryId}"]`);
    if (selectedItem) {
      selectedItem.classList.add('active');
    }

    const selectedCategory = categories[categoryId];
    
    // Count products for the selected category
    const categoryProducts = Object.values(products).filter(product => 
      product.categories.some(cat => cat.name === selectedCategory.name)
    );
    
    // Clear previous chart
    chartContainer.innerHTML = '';

    const productPrices = pricing[selectedCategory.name];
    console.log('Product Prices:', productPrices); // Debug log

    // Check if productPrices exists and is not empty
    if (!productPrices || Object.keys(productPrices).length === 0) {
      console.log('No price data available for this category');
      chartContainer.innerHTML = 'No hay datos disponibles para esta categoría';
      return;
    }

    // Prepare data for chart
    const dates = new Set();
    const priceData = {};

    Object.values(productPrices).forEach(product => {
      Object.entries(product.prices).forEach(([date, priceInfo]) => {
        dates.add(date);
        if (!priceData[date]) {
          priceData[date] = [];
        }
        priceData[date].push(parseFloat(priceInfo.price));
      });
    });

    const sortedDates = Array.from(dates).sort((a, b) => new Date(a) - new Date(b));
    const averagePrices = sortedDates.map(date => {
      const prices = priceData[date];
      return prices.reduce((sum, price) => sum + price, 0) / prices.length;
    });

    console.log('Dates:', sortedDates); // Debug log
    console.log('Average Prices:', averagePrices); // Debug log

    // Create the chart
    const ctx = document.createElement('canvas');
    chartContainer.appendChild(ctx);

    if (typeof Chart === 'undefined') {
      console.error('Chart.js is not loaded. Please include the Chart.js library.');
      chartContainer.innerHTML = 'Unable to load chart. Chart.js library is missing.';
      return;
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

  fetch('../scraper/data.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      categories = data.categories;
      products = data.products;
      pricing = data.pricing;

      // Create category list
      const categoryList = document.createElement('ul');
      categoryList.className = 'category-list';

      // Populate category list
      Object.keys(categories).forEach(categoryId => {
        const category = categories[categoryId];
        const listItem = document.createElement('li');
        listItem.textContent = category.name;
        listItem.dataset.categoryId = categoryId;
        listItem.addEventListener('click', () => selectCategory(categoryId));
        listItem.classList.add('category-item');
        categoryList.appendChild(listItem);
      });

      // Add category list to chart selector
      chartSelector.appendChild(categoryList);

      // Select the first category by default
      const firstCategoryId = Object.keys(categories)[0];
      selectCategory(firstCategoryId);
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
});